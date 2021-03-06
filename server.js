var express = require("express");
var app = express();
var redis = require("redis-url").connect(process.env.REDISTOGO_URL);
var async = require("async");

app.use(express.logger());
app.use("/", express.static(__dirname + "/static"));

// Show device status. Ex: GET http://127.0.0.1:5000/devices/testId
app.get("/devices/:id", function(req, res) {
	var id = req.params.id;
	redis.get("/devices/" + id, function(err, value) {
		if (value == null) {
			res.send(" ");//"A device with id '" + id + "' has not been registered");
		} else {
			res.send(value);//"Device id '" + id + "': " + value);
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

		res.send("OK");
	});
});

// List devices. Ex: GET http://127.0.0.1:5000/devices
app.get("/devices", function(req, res) {
	redis.lrange("/devices", 0, -1, function(err, devices) {
		if (devices == null || devices.length < 1) {
			res.send([]);
		} else {
			/*var resulAt = devices.length + " REGISTERED DEVICES:<br />";
			devices.forEach(function(id) {
				result += id + "<br />";
			});
			res.send(result);
			*/
			res.send(devices);
		}
	});
});

// Get device messages. Ex: GET http://127.0.0.1:5000/devices/test/messages
app.get("/devices/:id/messages", function(req, res) {
	var id = req.params.id;

	var result = " MESSAGES:<br />";

	redis.lrange("/devices/" + id + "/messages", 0, -1, function(err, messages) {
		if (messages == null || messages.length < 1) {
				res.send({});//"No device with id '" + id + "' registered");
		} else {
			/*for (var i = 0; i < messages.length; i++) {
				result += messages[i] + "<br />";
			}
			res.send(messages.length + result);*/
			res.send(messages);
		}
	});
});

// Send message to device. Ex: POST http://127.0.0.1:5000/devices/test/messages?message=doSomething
app.post("/devices/:id/messages", function(req, res) {
	var id = req.params.id;
	var msg = req.query["message"];

	var isRegistered = false;
	redis.lrange("/devices", 0, -1, function(err, devices) {
		if (devices == null || devices.length < 1) {
			res.send("No devices registered");
		} else {
			for (var i = 0; i < devices.length; i++) {
				if (id == devices[i]) {
					redis.lpush("/devices/" + id + "/messages", msg);
					res.send("OK");
					return;
				}
			}
			res.send("No device with id '" + id + "' registered");
		}
	});
});

// Clear all registered devices. Ex: GET http://127.0.0.1/reset
app.get("/reset", function(req, res) {
	redis.flushall();
	res.send("OK");
});

var port = process.env.PORT || 32123;
app.listen(port, function() {
	console.log("Listening on " + port);
});

