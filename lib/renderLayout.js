'use strict';

var fs = require('fs');
var extend = require('util')._extend;

var dot = require('dot');

var debug = (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined);
var URLS = {
	criticalCss: '/critical.css',
	mainCss: '/main.css',
	js: '/main.js',
	vendorJs: '/vendor.js'
};

module.exports = function(tollan) {
	dot.templateSettings.strip = !debug;
	var layout = dot.template(fs.readFileSync(__dirname + '/templates/layout.dot'));
	var applicationHead = false;
	var applicationBody = false;
	if (fs.existsSync('lib/templates/head.dot')) {
		applicationHead = dot.template(fs.readFileSync('lib/templates/head.dot'));
	}
	if (fs.existsSync('lib/templates/body.dot')) {
		applicationBody = dot.template(fs.readFileSync('lib/templates/body.dot'));
	}

	// Get the critical CSS from its file
	var criticalCss = fs.readFileSync('build' + URLS.criticalCss);

	// Determine whether to defer loading client assets
	// By default, it defers everything, unless one of the following is met:
	//  - NODE_ENV is development
	//  - Our application set defer* to false in its config
	var defer = {
		js: tollan.config.deferJs !== false && !debug,
		css: tollan.config.deferCss !== false && !debug,
		fonts: tollan.config.deferFonts !== false && !debug
	};

	var genericLayoutParams = {
		env: process.env.NODE_ENV,
		criticalCss: criticalCss,
		deferJs: defer.js,
		deferCss: defer.css,
		deferFonts: defer.fonts,
		criticalCssUrl: URLS.criticalCss,
		mainCssUrl: URLS.mainCss,
		jsUrl: URLS.js,
		haveVendorJs: debug,
		vendorJsUrl: URLS.vendorJs,
		defaultPageTitle: tollan.config.defaultPageTitle,
		applicationHead: '',
		applicationBody: ''
	};

	if (applicationHead) {
		genericLayoutParams.applicationHead = applicationHead(genericLayoutParams);
	}
	if (applicationBody) {
		genericLayoutParams.applicationBody = applicationBody(genericLayoutParams);
	}

	return function(renderedReactString) {
		var layoutParams = extend(
			{element: renderedReactString},
			genericLayoutParams
		);

		// Render our layout template and send that off
		var response = layout(layoutParams);

		return response;
	};
};
