'use strict';

var EventEmitter = require('eventemitter3');
var Promise = require('promise');

class GenericStore extends EventEmitter {
	constructor(tollan) {
		super();
		this.data = [];
		this.loaded = false;
		this.loadingPromise = undefined;
		this.tollan = tollan;
		this.model = undefined;
		this.maxAge = 5*60;
	}
	reload() {
		if (typeof this.loadingPromise !== 'undefined') {
			return this.loadingPromise;
		}
		this.loaded = false;
		this.loadingPromise = this.tollan.getModel(this.model)
			.then(items => {
				this.loadingPromise = undefined;
				this.data = items.length ? Array.from(items) : items;
				this.loaded = Date.now();
				this.emit('change');
			});
		return this.loadingPromise;
	}
	load() {
		var maxAgeAgo = Date.now() - this.maxAge*1000;
		if (this.loaded && this.loaded > maxAgeAgo) {
			return Promise.resolve();
		}
		return this.reload();
	}
	getAll() {
		this.load().done();
		return this.data;
	}
	dehydrate() {
		return {
			data: this.data,
			loaded: this.loaded
		};
	}
	rehydrate(hydratedData) {
		this.data = hydratedData.data;
		this.loaded = hydratedData.loaded;
	}
}

module.exports = GenericStore;
