var express = require('express');
var app = express();
var bodyParser = require('body-parser')
var storage = require('node-persist');
const fs = require('fs');
storage.initSync();
//^ ---  Importing and Inting Stuffs --- ^//

// Express Depentencied
app.use(express.static(__dirname + '/build'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


// Sloting Log
// 0. Initing Stuffs for Slot
const noOfSlots = 3;
const genSlot = () => {
	let curSlot = storage.getItemSync('curSlot');
	if(!curSlot) curSlot = 0;
	curSlot++;
	
	if(curSlot != 3) {
		storage.setItemSync('curSlot',curSlot );
	}else{
		storage.setItemSync('curSlot',0);
	}
	return curSlot;
}


const checkSlot = (slot) => {
	// if ture - use else not use use
	storage.setItemSync('engine-' + slot ,true);
	let status = storage.getItemSync('engine-' + slot);
	//if(status == '') status = true;
	console.log(slot + " : " + status.toString())
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


const genApp = () => {
	const myId = genId();
	const mySlot = genSlot();
	var slotIntervel = setInterval(() => {
		if(checkSlot(mySlot)) {
			stage1();
			clearInterval(slotIntervel);
		}
	}, 2000);
	const stage1 = () => {
		// Write id to file
		let AppData = {
  			name: "shopfront",
  			displayName: "shopfront",
  			appId : myId
		}
		
		let fileName = `../slots/engine-${myId}/app.json`;
		// write to a new file named 2pac.txt
		fs.writeFile(fileName, JSON.stringify(AppData), (err) => {  
		    // throws an error, you could also catch it here
		    if (err) throw err;

		    // success case, the file was saved
		    console.log('Lyric saved!');
		});
	}
}




// 1. Assing an Id


// 2. Check for the the avilable Slot


// Routing ()
app.post("/gen",(req, res) => {
	console.log(req.body);
	res.send("done")
})

app.get("/add", (req, res) => {
	genApp();
	res.send("asdas");
})
app.listen(process.env.PORT || 8080);

