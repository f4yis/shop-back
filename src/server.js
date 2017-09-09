var express = require('express');
var app = express();
import route from './route';

route(app);

app.listen(process.env.PORT || 8080, () => {
	console.log("this is a test")
});