'use strict';

var xhr = require('xhr');
var P = require('promise');

function mount() {
	console.log('Tollan app is mounting');
	var React = this.React;
	var Router = this.Router;

	var appElement = document.getElementById('tollanApp');

	Router.run(this.routes, Router.HistoryLocation, function(Handler) {
		console.time('render');
		React.render(React.createElement(Handler), appElement, function() {
			console.timeEnd('render');
		});
	});
}

function get(url) {
	return new P((resolve, reject) => {
		xhr({
			uri: this.apiPrefix + url,
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
}
function getModel(url) {
	return new P((resolve, reject) => {
		xhr({
			uri: this.apiPrefix + 'model/' + url,
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
}
function post (url, json) {
	return new P((resolve, reject) => {
		xhr({
			uri: this.apiPrefix + url,
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
}
function postAction(url, json) {
	return new P((resolve, reject) => {
		xhr({
			uri: this.apiPrefix + 'action/' + url,
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

var Tollan = require('./tollan');
Tollan.prototype.mount = mount;
Tollan.prototype.get = get;
Tollan.prototype.getModel = getModel;
Tollan.prototype.post = post;
Tollan.prototype.postAction = postAction;
Tollan.prototype.SERVER = false;

module.exports = Tollan;
