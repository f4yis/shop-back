var express = require('express');
var app = express();
var bodyParser = require('body-parser')


app.use(express.static(__dirname + '/build'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.post("/gen",(req, res) => {
	console.log(req.body);
	res.send("done")
})
app.listen(process.env.PORT || 8080);