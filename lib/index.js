'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var bunyan = require('bunyan');

var zen = require('./zen');

// Get our Express app instance
var app = express();

var log = bunyan.createLogger({
	name: 'tollan'
});

require('./middleware')(app);

// The application should call this function when it is done figuring out its
// configuration and has set up any Express middleware desired. This will start
// the server listening for requests.
function start() {
	var routes = tollan.config.routes;
	var React = tollan.React;
	var Router = tollan.Router;
	
	var renderLayout = require('./renderLayout')(tollan);

	app.all('*', function(req, res, next) {
		Router.run(routes, req.url, function(Handler, state) {
			// Get the name of the found route. If it's equal to 404 then it's
			// the default not-found route, and we should return a 404 status.
			// Otherwise, the default 200 status is fine.
			var name = state.routes[state.routes.length - 1].name;
			if (name === '404') {
				res.status(404);
			}

			// Render the React component for this route to a string
			var reactElement = React.renderToString(React.createElement(Handler, {
				method: req.method,
				body: req.body
			}));

			res.send(renderLayout(reactElement));
		});
	});

	var server = app.listen(tollan.config.port, function() {
		var port = server.address().port;

		log.info(
			'Tollan app listening on port %s in %s mode',
			port,
			process.env.NODE_ENV
		);
		log.info(zen());
	});
}

function profile(log) {
	var startTime = Date.now();
	log.info('[profile] ============ ');
	var pad = '  ';
	return function(text) {
		var time = '' + (Date.now() - startTime);
		time = pad.substring(0, pad.length - time.length) + time;
		log.info('[profile]', time, 'ms:', text);
		startTime = Date.now();
	}
}

// Public API we present to Tollan applications
var tollan = {
	express: express,
	app: app,
	start: start,
	SERVER: true,
	profile: profile
};

module.exports = tollan;
