'use strict';

var express = require('express');
var app = express();

require('./api').route(app);

app.listen(process.env.PORT || 8080, function () {
	console.log("this is a test");
});