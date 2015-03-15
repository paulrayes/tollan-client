'use strict';

var EventEmitter = require('eventemitter3');

var Dispatcher = function() {

}

Dispatcher.prototype = assign(Dispatcher.prototype, EventEmitter.prototype);

module.exports = Dispatcher;
