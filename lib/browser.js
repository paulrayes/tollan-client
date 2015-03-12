'use strict';

var xhr = require('xhr');
var P = require('promise');

function mount() {
	console.log('Tollan app is mounting');
	var React = tollan.React;
	var Router = tollan.Router;

	//tollan.config = config;
	var appElement = document.getElementById('tollanApp');

	Router.run(tollan.config.routes, Router.HistoryLocation, function(Handler) {
		console.time('render');
		React.render(React.createElement(Handler), appElement, function() {
			console.timeEnd('render');
		});
	});
}

var api = {
	get: function(url) {
		return new P(function (resolve, reject) {
			xhr({
				uri: tollan.config.apiPrefix + '/' + url,
				//json: json,
				method: 'GET'
			}, function(err, resp, body) {
				if (err) {
					reject(err);
				} else {
					resolve(resp);
				}
			});
		});
	},
	getModel: function(url) {
		return new P(function (resolve, reject) {
			xhr({
				uri: tollan.config.apiPrefix + '/model/' + url,
				//json: json,
				method: 'GET'
			}, function(err, resp, body) {
				if (err) {
					reject(err);
				} else if (resp.statusCode >= 500) {
					reject(resp);
				} else if (resp.statusCode !== 200) {
					reject(resp);
				} else {
					resolve(JSON.parse(resp.body));
				}
			});
		});
	},
	post: function(url, json) {
		return new P(function (resolve, reject) {
			xhr({
				uri: tollan.config.apiPrefix + '/' + url,
				json: json,
				method: 'POST'
			}, function(err, resp, body) {
				if (err) {
					reject(err);
				} else {
					resolve(resp);
				}
			});
		});
	},
	postAction: function(url, json) {
		return new P(function (resolve, reject) {
			xhr({
				uri: tollan.config.apiPrefix + '/action/' + url,
				json: json,
				method: 'POST'
			}, function(err, resp, body) {
				if (err) {
					reject(err);
				} else if (resp.statusCode >= 500) {
					reject(resp);
				} else {
					resolve(resp);
				}
			});
		});
	}
};

var tollan = {
	mount: mount,
	api: api,
	SERVER: false
};

module.exports = tollan;
