'use strict';

//var React = require('react/addons');
var assign = require('object-assign');
var EventEmitter = require('eventemitter3');
var Promise = require('promise');

if (process.browser) {
	var xhr = require('xhr');
} else {
	var request = require('request');
}

// Public API we present to Tollan applications
var Tollan = function() {
	this.prefix = '';
	this.stores = [];
	this.storeInstances = [];
	this.port = 3001;
	this.absoluteUrl = 'http://localhost:3001';
	this.apiPrefix = '/api/';
	this.defaultPageTitle = 'Tollan';
	this.routes = [];
	this.dispatcher = new EventEmitter();
	this.apiHeaders = {
		'accept': 'application/json'
	};
	if (!process.browser) {
		this.dataDirectory = process.cwd() + '/data/';
	}
	this.loadedBundles = [];

	var React = this.React;

	var SmallLoader = React.createClass({
		render: function() {
			return <span>Loading...</span>;
		}
	});
	var LargeLoader = React.createClass({
		render: function() {
			return (
				<div>
					<p></p>
					<p>Loading...</p>
					<p></p>
				</div>
			);
		}
	});

	this.loaderComponents = {
		small: SmallLoader,
		large: LargeLoader
	};
};
Tollan.prototype.setStore = function setStore(name, Store) {
	this.stores[this.prefix + name] = Store;
	//this.storeInstances[this.prefix + name] = new Store();
};
Tollan.prototype.getStore = function getStore(name) {
	if (typeof this.storeInstances[this.prefix + name] === 'undefined') {
		if (typeof this.stores[this.prefix + name] === 'undefined') {
			throw('Could not find store with name ' + this.prefix + name);
		}
		this.storeInstances[this.prefix + name] = new (this.stores[this.prefix + name])(this);
	}
	return this.storeInstances[this.prefix + name];
};
Tollan.prototype.clone = function() {
	//var clonedTollan = assign({}, this);
	var clonedTollan = new Tollan();
	assign(clonedTollan, this);
	//clonedTollan.prototype = assign({}, this.prototype);
	//console.log(Object.keys(clonedTollan));
	//console.log('=========================================================================================================');
	//console.log(Object.keys(this));
	clonedTollan.storeInstances = [];
	return clonedTollan;
}
Tollan.prototype.Tollan = function(prefix) {
	var prefixedTollan = new Tollan();
	assign(prefixedTollan, this);
	return prefixedTollan;
};
Tollan.prototype.prefixUrl = function(url) {
	if (process.browser) {
		return this.apiPrefix + url;
	} else {
		return this.absoluteUrl + this.apiPrefix + url;
	}
}
Tollan.prototype.get = function(url) {
	return new Promise((resolve, reject) => {
		function cb(err, resp, body) {
			if (err) {
				reject(err);
			} else {
				resolve(resp);
			}
		}
		if (process.browser) {
			xhr({
				uri: this.prefixUrl(url),
				method: 'GET',
				headers: this.apiHeaders
			}, cb);
		} else {
			request(this.prefixUrl(url), cb);
		}
	});
}
Tollan.prototype.getModel = function(url) {
	return this.get('model/' + url)
		.then(resp => {
			if (typeof resp.body === 'undefined') {
				// Can't JSON.parse undefined
				throw new Error('Server returned undefined');
			} else {
				return resp;
			}
		})
		.then(resp => {
			if ((resp.statusCode >= 200 && resp.statusCode < 300)) {
				return JSON.parse(resp.body);
			} else {
				resp.body = JSON.parse(resp.body);
				throw resp;
			}
			//return JSON.parse(resp.body);
		});
	/*return new Promise((resolve, reject) => {
		xhr({
			uri: this.prefixUrl('model/' + url),
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
	});*/
}
Tollan.prototype.post = function(url, json) {
	return new Promise((resolve, reject) => {
		function cb(err, resp, body) {
			if (err) {
				reject(err);
			} else {
				resolve(resp);
			}
		}
		if (process.browser) {
			xhr({
				uri: this.prefixUrl(url),
				json: json,
				method: 'POST',
				headers: this.apiHeaders
			}, cb);
		} else {
			log.error('Tollan.post is not yet implemented in server environments');
		}
	});
}
Tollan.prototype.postAction = function(url, json) {
	return this.post('action/' + url, json).then(resp => {
		if ((resp.statusCode >= 200 && resp.statusCode < 300)) {
			return resp;
		} else {
			throw resp;
		}
		//return JSON.parse(resp.body);
	});
	/*return new Promise((resolve, reject) => {
		xhr({
			uri: this.prefixUrl('action/' + url),
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
	});*/
}

Tollan.prototype.dehydrate = function dehydrate() {
	var stores = this.storeInstances;
	var json = {};
	Object.keys(stores).forEach(name => {
		if (typeof stores[name].dehydrate === 'function') {
			json[name] = stores[name].dehydrate();
		}
	});
	return JSON.stringify(json);
};
Tollan.prototype.rehydrate = function rehydrate(data) {
	Object.keys(data).forEach(name => {
		var store = this.getStore(name);
		if (typeof store.rehydrate === 'function') {
			store.rehydrate(data[name]);
		}
	});
}

module.exports = Tollan;
