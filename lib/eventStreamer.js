'use strict';

var redis = require('redis');
var client = redis.createClient();
var subscriberClient = null;

var bunyan = require('bunyan');
var log = bunyan.createLogger({
	name: 'eventStreamer'
});

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
		index: 0,
		handler: handler
	});

	log.info('Registered projection ' + name + ' for event ' + event);
}

function processEvent(message) {
	if (typeof listeners[message.event] === 'undefined') {
		log.warn('No projections for event ' + message.index + ' (' + message.event + ')');
		return;
	}
	var newProjectionIndex = {};
	listeners[message.event].forEach(listener => {
		if (message.index > listener.index) {
			newProjectionIndex[listener.name] = message.index;
			listener.handler(message);
			log.info('Ran projection ' + listener.name + ' for event ' + message.index + ' (' + message.event + ')')
			listener.index = message.index;
		}
	});
	if (Object.keys(newProjectionIndex).length > 0) {
		client.hmset('projectionIndex', newProjectionIndex);
	}
	//log.info('Processed event ' + message.index + ' (' + message.event + ')');
}

function subscribe() {
	subscriberClient = redis.createClient();
	subscriberClient.subscribe('events');
	subscriberClient.on('message', function(channel, message) {
		message = JSON.parse(message);
		if (usingSubscribed) {
			processEvent(message);
		} else {
			latestSubscribedIndex = message.index;
			if (latestSubscribedIndex === latestQueriedIndex + 1) {
				usingSubscribed = true;
				log.info('Switching over to event stream instead of saved events');
				client.quit();
				processEvent(message);
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
				latestQueriedIndex++;
				client.lrange('events', latestQueriedIndex, eventCount, function(err, events) {
					if (err) throw err;

					events.forEach(function(message) {
						message = JSON.parse(message);
						message.index = latestQueriedIndex;
						processEvent(message);
						latestQueriedIndex++;
					});
					latestQueriedIndex--;

					log.info('Processed ' + newCount + ' events (' + (latestQueriedIndex-newCount+1) + ' - ' + latestQueriedIndex + ')');
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

function start() {
	client.hgetall('projectionIndex', function(err, indexes) {
		if (err) {
			throw err;
		}

		if (indexes !== null && typeof indexes === 'object') {
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
