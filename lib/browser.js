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

function loadBundle(name) {
	return new P((resolve, reject) => {
		if (this.SERVER) {
			return resolve();
		}
		if (this.loadedBundles.indexOf(name) > -1) {
			return resolve();
		}
		var src = '/' + name + '.js';
		var script = document.createElement('script');
		script.async = true;
		script.src = src;

		script.onerror = () => {
			reject(new Error("Failed to load" + src));
		};

		script.onload = () => {
			console.log('Loaded bundle: ' + name);
			this.loadedBundles.push(name);
			resolve();
		};

		document.getElementsByTagName("head")[0].appendChild(script);
	});
}

var Tollan = require('./tollan');
Tollan.prototype.mount = mount;
Tollan.prototype.get = get;
Tollan.prototype.getModel = getModel;
Tollan.prototype.post = post;
Tollan.prototype.postAction = postAction;
Tollan.prototype.SERVER = false;
Tollan.prototype.loadBundle = loadBundle;

module.exports = Tollan;
