'use strict';

var fs = require('fs');
var cmd = require('node-cmd');
var express = require('express');
var Promise = require('bluebird');
var getAsync = Promise.promisify(cmd.get, { multiArgs: true, context: cmd });
var bodyParser = require('body-parser');
var storage = require('node-persist');
storage.initSync();
//^ ---  Importing and Inting Stuffs --- ^//

module.exports = {
	route: function route(app) {
		storage.setItemSync('engine-1', true);
		storage.setItemSync('engine-2', true);
		app.use(express.static(__dirname + '/build'));
		app.use('/output', express.static('../build'));
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({ extended: true }));
		app.use(function (req, res, next) {

			// Website youdddd wish to allow to connect
			res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

			// Request methods you wish to allow
			res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

			// Request headers you wish to allow
			res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

			// Set to true if you need the website to include cookies in the requests sent
			// to the API (e.g. in case you use sessions)
			res.setHeader('Access-Control-Allow-Credentials', true);

			// Pass to next layer of middleware
			next();
		});

		var genApp = function genApp(myId, mySlot) {
			//storage.setItemSync('engine-' + mySlot ,true);
			storage.setItemSync('started-' + myId, false);
			storage.setItemSync('finished-' + myId, false);
			var slotIntervel = setInterval(function () {
				if (checkSlot(mySlot)) {
					stage1();
					clearInterval(slotIntervel);
				}
				console.log("wating");
			}, 4000);
			var stage1 = function stage1() {
				console.log("stage on  of " + mySlot);
				// Block the slot
				storage.setItemSync('engine-' + mySlot, false);
				// Write id to file
				var AppData = {
					name: "shopfront",
					displayName: "shopfront-" + myId,
					appId: myId
				};

				var fileName = '../slots/engine-' + mySlot + '/app.json';
				fs.writeFile(fileName, JSON.stringify(AppData), function (err) {
					// throws an error, you could also catch it here
					if (err) throw err;

					stage2();
				});
			};

			var stage2 = function stage2() {
				storage.setItemSync('started-' + myId, true);
				console.log("Build Started ");

				getAsync('\n\t\t\t\t        cd ../slots/engine-' + mySlot + '/android && ./gradlew assembleRelease\n\t\t\t\t').then(function (data) {
					console.log('cmd data', data);
					getAsync('\n\t\t\t\t\tcp ../slots/engine-' + mySlot + '/android/app/build/outputs/apk/app-release.apk ../build/app-' + myId + '.apk\n\t\t\t\t\t').then(function (data) {
						storage.setItemSync('engine-' + mySlot, true);
						storage.setItemSync('finished-' + myId, true);
					});
				}).catch(function (err) {
					console.log('cmd err', err);
					storage.setItemSync('engine-' + mySlot, true);
					storage.setItemSync('finished-' + myId, true);
				});
			};
		};
		app.post("/generate", function (req, res) {
			var myId = genId();
			var mySlot = genSlot();
			//mySlot = 2;
			genApp(myId, mySlot);
			var data = {
				myId: myId,
				mySlot: mySlot
			};
			console.log(data);
			res.send(JSON.stringify(data));
		});

		var noOfSlots = 2;
		var genSlot = function genSlot() {
			var curSlot = storage.getItemSync('curSlot');
			if (!curSlot) curSlot = 0;
			curSlot++;
			if (curSlot < noOfSlots) {
				storage.setItemSync('curSlot', curSlot);
			} else {
				storage.setItemSync('curSlot', 0);
			}
			return curSlot;
		};

		var checkSlot = function checkSlot(slot) {
			// if ture - use else not use use
			//storage.setItemSync('engine-' + slot ,true);
			var status = storage.getItemSync('engine-' + slot);
			//if(status == '') status = true;
			//console.log(slot + " : " + status.toString())
			return status;
		};

		var genId = function genId() {
			var id = storage.getItemSync('id');
			if (!id) {
				id = 1000;
			}
			id++;
			storage.setItemSync('id', id);
			return id;
		};

		app.post('/check-build', function (req, res) {
			var slot = req.body.slot;
			var id = req.body.id;
			console.log(storage.getItemSync('started-' + id) + " : " + id);
			if (storage.getItemSync('started-' + id)) {
				//console.log(slot, storage.getItemSync('engine-' + slot))
				res.json({ status: storage.getItemSync('finished-' + id) });
			} else {
				res.json({ status: false });
			}
		});
	}
};