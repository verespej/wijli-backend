var express = require("express");
var app = express();
var redis = require("redis-url").connect(process.env.REDISTOGO_URL);

app.use(express.logger());

redis.get("id", function(err, value) {
	if (value == null) {
		redis.set("id", "id1");
	}
});

app.get("/", function(req, res) {
	res.send("hello!");
});

app.get("/id", function(req, res) {
	redis.get("id", function(err, value) {
		res.send("result: " + value);
	});
});

var port = process.env.PORT || 32123;
app.listen(port, function() {
	console.log("Listening on " + port);
});

