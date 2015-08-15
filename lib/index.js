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

function profile(profileLog, warnThreshold) {
	var startTime = Date.now();
	var pad = '   ';
	var l = function(text, data) {
		var level = this;
		if (typeof this !== 'string') {
			level = 'info';
		}
		var time = '' + (Date.now() - startTime);
		if (typeof warnThreshold !== 'undefined' && time > warnThreshold) {
			level = 'warn';
		}
		time = pad.substring(0, pad.length - time.length) + time;
		if (typeof data === 'undefined') {
			profileLog[level](time + 'ms: ' + text);
		} else {
			profileLog[level](time + 'ms: ' + text, data);
		}
		startTime = Date.now();
	};
	l.info = l.bind('info');
	l.debug = l.bind('debug');
	l.warn = l.bind('warn');
	l.error = l.bind('error');
	return l;
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
			tollan.redisClient.publish('events', JSON.stringify(message), (err1) => {
				if (err1) {
					log.error(err1);
					reject(err1);
				}
				log.info('Saved event ' + length + ' (' + event + ')');
				resolve(message);
			});
		});
	});
};

var eventStreamer = require('./eventStreamer');
Tollan.prototype.registerProjection = eventStreamer.registerProjection;
Tollan.prototype.startEventStreamer = function() {
	eventStreamer.start(this);
};

module.exports = Tollan;
