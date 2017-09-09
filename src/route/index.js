import fs from 'fs';
import cmd from 'node-cmd'
import express from 'express'
import Promise from 'bluebird'
import bodyParser from 'body-parser'
import storage from 'node-persist'

const getAsync = Promise.promisify(
		cmd.get,
		{ multiArgs: true, context: cmd }
	)
storage.initSync();

export default (app) => {
	storage.setItemSync('engine-1' ,true);
	storage.setItemSync('engine-2' ,true);
	app.use(express.static(__dirname + '/build'));
	app.use('/output', express.static('../build'))
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended: true}));
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

	const genApp = (myId, mySlot) => {
		//storage.setItemSync('engine-' + mySlot ,true);
		storage.setItemSync('started-' + myId ,false);
		storage.setItemSync('finished-' + myId ,false);
		var slotIntervel = setInterval(() => {
			if(checkSlot(mySlot)) {
				stage1();
				clearInterval(slotIntervel);
			}
			console.log("wating");
		}, 4000);
		const stage1 = () => {
			console.log("stage on  of " + mySlot)
			// Block the slot
			storage.setItemSync('engine-' + mySlot , false);
			// Write id to file
			let AppData = {
	  			name: "shopfront",
	  			displayName: "shopfront-" + myId,
	  			appId : myId
			}
			
			let fileName = `../slots/engine-${mySlot}/app.json`;
			fs.writeFile(fileName, JSON.stringify(AppData), (err) => {  
			    // throws an error, you could also catch it here
			    if (err) throw err;

			    stage2();
			});
		}

		const stage2 = () => {
			storage.setItemSync('started-' + myId ,true);
			console.log("Build Started ");

			getAsync(`
			        cd ../slots/engine-${mySlot}/android && ./gradlew assembleRelease
			`).then(data => {
			  console.log('cmd data', data)
			  getAsync(`
				cp ../slots/engine-${mySlot}/android/app/build/outputs/apk/app-release.apk ../build/app-${myId}.apk
				`).then(data => {
					storage.setItemSync('engine-' + mySlot , true);
			  		storage.setItemSync('finished-' + myId , true);
				})

			}).catch(err => {
			  console.log('cmd err', err)
			  storage.setItemSync('engine-' + mySlot , true);
			  storage.setItemSync('finished-' + myId , true);
			});
		}
	}
	app.post("/generate", (req, res) => {
		const myId = genId();
		let mySlot = genSlot();
		//mySlot = 2;
		genApp(myId, mySlot);
		let data = {
			myId : myId,
			mySlot :mySlot 
		}
		console.log(data)
		res.send(JSON.stringify(data));
	});

	const noOfSlots = 2;
	const genSlot = () => {
		let curSlot = storage.getItemSync('curSlot');
		if(!curSlot) curSlot = 0;
		curSlot++;
		if(curSlot < noOfSlots) {
			storage.setItemSync('curSlot', curSlot );
		}else{
			storage.setItemSync('curSlot',0);
		}
		return curSlot;
	}


	const checkSlot = (slot) => {
		// if ture - use else not use use
		//storage.setItemSync('engine-' + slot ,true);
		let status = storage.getItemSync('engine-' + slot);
		//if(status == '') status = true;
		//console.log(slot + " : " + status.toString())
		return status;
	}

	const genId = () => {
		let id = storage.getItemSync('id');
		if(!id){
			id = 1000
		}
		id++;
		storage.setItemSync('id',id);
		return id;
	}

	app.post('/check-build', (req, res) =>{
		let slot = req.body.slot
		let id = req.body.id
		console.log(storage.getItemSync('started-' + id ) + " : " + id)
		if(storage.getItemSync('started-' + id)){
			//console.log(slot, storage.getItemSync('engine-' + slot))
			res.json({status : storage.getItemSync('finished-' + id) });
		}else{
			res.json({status : false });
		}
	})

}
