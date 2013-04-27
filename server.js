var express = require("express");
var app = express();
var redis = require("redis-url").connect(process.env.REDISTOGO_URL);

app.use(express.logger());

app.get("/", function(req, res) {
	res.send("Operations:<br />/devices<br />/devices/{id}<br />");
});

// Show device status. Ex: GET http://127.0.0.1:5000/devices/testId
app.get("/devices/:id", function(req, res) {
	var id = req.params.id;
	redis.get("/devices/" + id, function(err, value) {
		if (value == null) {
			res.send("A device with id '" + id + "' has not been registered");
		} else {
			res.send("Device id '" + id + "': " + value);
		}
	});
});

// Create device and/or set status. Ex: POST http://127.0.0.1:5000/devices/testId
app.post("/devices/:id", function(req, res) {
	var id = req.params.id;
	var deviceStatus = req.query["status"];
	if (deviceStatus == null) {
		deviceStatus = "";
	}

	redis.lrange("/devices", 0, -1, function(err, devices) {
		var create = true;

		if (devices != null) {
			for (var i = 0; i < devices.length; i++) {
				if (id == devices[i]) {
					create = false;
				}
			}
		}

		if (create) {
			redis.lpush("/devices", id);
		}

		redis.set("/devices/" + id, deviceStatus);
	});
});

// List devices. Ex: GET http://127.0.0.1:5000/devices
app.get("/devices", function(req, res) {
	redis.lrange("/devices", 0, -1, function(err, devices) {
		if (devices == null || devices.length < 1) {
			res.send("No devices registered");
			//res.send(devices);
		} else {
			var result = devices.length + " REGISTERED DEVICES:<br />";
			devices.forEach(function(id) {
				result += id + "<br />";
			});
			res.send(result);
		}
	});
});

// Clear all registered devices. Ex: GET http://127.0.0.1/reset
app.get("/reset", function(req, res) {
	redis.flushall();
	res.send("DB cleared");
});

var port = process.env.PORT || 32123;
app.listen(port, function() {
	console.log("Listening on " + port);
});

