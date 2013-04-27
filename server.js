var express = require("express");
var app = express();

app.use(express.logger());

app.get('/', function(req, res) {
	res.send('hello!');
});

var port = process.env.PORT || 32123;
app.listen(port, function() {
	console.log("Listening on " + port);
});

