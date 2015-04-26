'use strict';

var assign = require('object-assign');
var EventEmitter = require('eventemitter3');

// Public API we present to Tollan applications
var Tollan = function() {
	this.prefix = '';
	this.stores = [];
	this.storeInstances = [];
	this.port = 3001;
	this.apiPrefix = '/api/';
	this.defaultPageTitle = 'Tollan';
	this.routes = [];
	this.dispatcher = new EventEmitter();
	this.dataDirectory = process.cwd() + '/data/';
	this.loadedBundles = [];
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
		this.storeInstances[this.prefix + name] = new (this.stores[this.prefix + name])();
	}
	return this.storeInstances[this.prefix + name];
};
Tollan.prototype.Tollan = function(prefix) {
	var prefixedTollan = new Tollan();
	assign(prefixedTollan, this);
	return prefixedTollan;
};

module.exports = Tollan;
