'use strict';

function genReqId(req) {
	return req.id;
};
function levelFn(status, err) {
	if (err || status >= 500) {
		// server internal error or error
		return 'error';
	} else if (status > 400) {
		// client error
		return 'warn';
	} else if (status === 400) {
		// validation error
		return 'info';
	}
	return 'info';
};

module.exports = function(app) {
	// Parse JSON bodies in POST requests
	app.use(require('body-parser').json());

	// gzip in production
	if (process.env.NODE_ENV !== 'development') {
		app.use(require('compression')());
	}

	// Generate request ID
	var requestsServed = 0;
	app.use(function(req, res, next) {
		if (process.env.NODE_ENV !== 'development') {
			req.id = ++requestsServed;
		}
		next();
	});

	// Log requests
	if (process.env.NODE_ENV !== 'development') {
		app.use(require('express-bunyan-logger')({
			parseUA: false,
			genReqId: genReqId,
			levelFn: levelFn
		}));
	} else {
		app.use(require('express-bunyan-logger')({
			parseUA: false,
			excludes: ['req', '*'],
			src: true,
			genReqId: genReqId,
			levelFn: levelFn,
			format: ':method :url :status-code :response-time ms :res-headers[content-length] '
		}));
	}
};
