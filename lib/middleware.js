'use strict';

var log = require('logule').init(module, 'express');

/*function genReqId(req) {
	return req.id;
}
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
}*/

module.exports = function(app) {
	// Parse JSON bodies in POST requests
	app.use(require('body-parser').json());

	var debug = process.env.NODE_ENV === 'development' || typeof process.env.NODE_ENV === 'undefined';

	// gzip in production
	if (!debug) {
		app.use(require('compression')());
	}

	// Generate request ID
	var requestsServed = 0;
	app.use(function(req, res, next) {
		//if (!debug) {
			req.id = ++requestsServed;
		//}
		next();
	});

	// Log requests
	app.use(function(req, res, next) {
		var start = Date.now();

		if (res._responseTime) return next();
		res._responseTime = true;

		res.on('finish', function(){
			var duration = Date.now() - start;
			//res.setHeader('X-Response-Time', duration + 'ms');
			var size = Math.round(res._headers['content-length']/100)/10;
			log.info(`${res.statusCode} ${req.method} ${req.originalUrl}  -  ${duration} ms  -  ${size} KB`);
		});
		next();
	});
	/*if (debug || true) {
		app.use(require('express-bunyan-logger')({
			parseUA: false,
			excludes: ['req', '*'],
			src: true,
			genReqId: genReqId,
			levelFn: levelFn,
			format: ':method :url :status-code :response-time ms :res-headers[content-length] '
		}));
	} else {
		app.use(require('express-bunyan-logger')({
			parseUA: false,
			genReqId: genReqId,
			levelFn: levelFn
		}));
	}*/
};
