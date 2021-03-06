'use strict';

var redis = require('redis');
var client = redis.createClient();
var subscriberClient = null;

var async = require('async');
var Promise = require('promise');
//var bunyan = require('bunyan');
var log = require('logule').init(module, 'eventStreamer');
//winston.push('client');
//var log = bunyan.createLogger({
//	name: 'eventStreamer'
//});

/*	List of listeners
	structure: {
		eventName: [
			{index: 4, handler: function}
		]
	}
*/
var listeners = {};

var latestQueriedIndex = Infinity;//0;
var latestSubscribedIndex = 0;
var usingSubscribed = false;
var INTERVAL = 500; // ms delay between fetching batches of saved events

var tollan = undefined;

/*var projectionQueue = new Promise(function(resolve, reject) {
	resolve();
});*/

function registerProjection(event, name, handler) {
	var alreadyRegistered = false;
	if (typeof listeners[event] === 'undefined') {
		listeners[event] = [];
	}
	listeners[event].forEach(listener => {
		if (listener.handler === handler) {
			alreadyRegistered = true;
		}
	});
	if (alreadyRegistered) {
		log.warn('You are registering projection ' + name + ' for event ' + ' ' + event + ' multiple times; ignoring all but the first one');
		return;
	}

	listeners[event].push({
		name: name,
		index: -1,
		handler: handler
	});

	log.info('Registered projection ' + name + ' for event ' + event);
}

var projectionQueue = async.queue(function(message, next) {
	if (typeof listeners[message.event] === 'undefined') {
		log.warn('No projections for event ' + message.index + ' (' + message.event + ')');
		next();
		return;
	}
	var r = true;
	var newProjectionIndex = {};
	var handlers = [];
	var promises = [];
	var messageProfile = tollan.profile(log);
	listeners[message.event].forEach(function(listener) {
		if (message.index > listener.index) {
			let handlerProfile = tollan.profile(log, 100);
			newProjectionIndex[listener.name] = message.index;
			let handlerPromise = Promise.resolve(listener.handler(message)).then(function() {
				handlerProfile.debug('Ran projection ' + listener.name + ' for event ' + message.index + ' (' + message.event + ')');
			});
			promises.push(handlerPromise);
			listener.index = message.index;
		}
	});
	if (Object.keys(newProjectionIndex).length > 0) {
		client.hmset('projectionIndex', newProjectionIndex);
	}
	Promise.all(promises).then(function() {
		messageProfile('Ran projections for event ' + message.index + ' (' + message.event + ')');
		next();
	}).done();
});


function checkQueue() {
	if (projectionQueue.length() > 1) {
		log.info(projectionQueue.length() + ' projections waiting to run');
	} else if (projectionQueue.length() > 10) {
		log.warn(projectionQueue.length() + ' projections waiting to run');
	}
	setTimeout(checkQueue, 5000);
}
setTimeout(checkQueue, 5000);

function subscribe() {
	subscriberClient = redis.createClient();
	subscriberClient.subscribe('events');
	subscriberClient.on('message', function(channel, message) {
		message = JSON.parse(message);
		if (usingSubscribed) {
			//processEvent(message);
			projectionQueue.push(message);
		} else {
			latestSubscribedIndex = message.index;
			if (latestSubscribedIndex === latestQueriedIndex + 1) {
				usingSubscribed = true;
				log.info('Switching over to event stream instead of saved events');
				client.quit();
				//processEvent(message);
				projectionQueue.push(message);
			}
		}
	});
}

function processNew() {
	client.llen('events', function(err, eventCount) {
		if (err) throw err;
		var newCount = eventCount - latestQueriedIndex - 1;
		if (newCount > 100) {
			// Only fetch 100 at a time for rate limiting
			newCount = 100;
			eventCount = latestQueriedIndex + 100;
		} else if (!subscriberClient) {
			// Now that there are less than 100 events, subscribe to new ones
			// (unless we are already subscribed)
			subscribe();
			log.info('Subscribed to event stream; still using saved events');
		}
		if (!usingSubscribed) {
			// Not using subscribed events, so process these if there are new ones
			if (newCount) {
				var first = 1*latestQueriedIndex + 1;
				client.lrange('events', first, eventCount, function(err, events) {
					if (err) throw err;

					events.forEach(function(message) {
						latestQueriedIndex++;
						message = JSON.parse(message);
						message.index = latestQueriedIndex;
						projectionQueue.push(message);
					});

					log.info('Processed ' + newCount + ' events (' + first + ' - ' + latestQueriedIndex + ')');
				});
			} else {
				//log.info('No new saved events');
				// Just because there are no new saved events doesn't mean we can switch
				// over to using the event stream. An event could have been saved
				// during the time it took us to check if there are new events.
				// The only reliable way to check this is to wait until an event received
				// over our subscription is the one right after the last processed saved
				// event.
			}
			setTimeout(processNew, INTERVAL);
		}
	});
}

function start(tollanInstance) {
	tollan = tollanInstance;
	client.hgetall('projectionIndex', function(err, indexes) {
		if (err) {
			throw err;
		}

		if (false && indexes !== null && typeof indexes === 'object') {
			for (var event in listeners) {
				listeners[event].forEach(listener => {
					if (isFinite(indexes[listener.name]) && indexes[listener.name] < latestQueriedIndex) {
						latestQueriedIndex = indexes[listener.name];
					}
				});
			}
			log.info('Re-playing all events after event ' + latestQueriedIndex);
		} else {
			log.info('It seems this is the first time running this application; re-playing all events');
			latestQueriedIndex = -1;
		}
		processNew();
	});
}

var EventStreamer = {
	start: start,
	registerProjection: registerProjection
};

module.exports = EventStreamer;
