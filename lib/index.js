'use strict';

var express = require('express');
var bodyParser = require('body-parser');
//var bunyan = require('bunyan');
var log = require('logule').init(module, 'tollan');

var zen = require('./zen');

// Get our Express app instance
var app = express();

//var log = bunyan.createLogger({
//	name: 'tollan'
//});

require('./middleware')(app);

// The application should call this function when it is done figuring out its
// configuration and has set up any Express middleware desired. This will start
// the server listening for requests.
function start(render) {
	var tollan = this;

	tollan.renderLayout = require('./renderLayout')(tollan);

	var server = app.listen(tollan.port, function() {
		var port = server.address().port;

		log.info(
			'Tollan app listening on port %s in %s mode',
			port,
			process.env.NODE_ENV
		);
		log.info(zen());
	});
}

function profile(profileLog) {
	var startTime = Date.now();
	var pad = '   ';
	return function(text, data) {
		var time = '' + (Date.now() - startTime);
		time = pad.substring(0, pad.length - time.length) + time;
		profileLog.info(data, '[profile]' + time + 'ms: ' + text);
		startTime = Date.now();
	};
}

// Public API we present to Tollan applications
var Tollan = require('./tollan');
Tollan.prototype.express = express;
Tollan.prototype.app = app;
Tollan.prototype.start = start;
Tollan.prototype.SERVER = true;
Tollan.prototype.profile = profile;

Tollan.prototype.saveEvent = function saveEvent(event, data) {
	var tollan = this; // bc the promise will become `this`
	return new Promise((resolve, reject) => {
		var message = {
			time: Date.now(),
			event: event,
			data: data
		};
		tollan.redisClient.rpush('events', JSON.stringify(message), (err, length) => {
			if (err) {
				log.error(err);
				reject(err);
			}
			message.index = length - 1;
			tollan.redisClient.publish('events', JSON.stringify(message), (err) => {
				if (err) {
					log.error(err);
					reject(err);
				}
				log.info('Saved event ' + length + ' (' + event + ')');
				resolve(message);
			});
		});
	});
};

var eventStreamer = require('./eventStreamer');
Tollan.prototype.registerProjection = eventStreamer.registerProjection;
Tollan.prototype.startEventStreamer = eventStreamer.start;

module.exports = Tollan;
