'use strict';

var fs = require('fs');
var extend = require('util')._extend;

var dot = require('dot');
var styleHtml = require('html').prettyPrint;

var debug = (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined);

var URLS = {
	criticalCss: '/critical.css',
	mainCss: '/main.css',
	js: '/main.js',
	vendorJs: '/vendor.js'
};

function loadApplicationLayout(params) {
	if (fs.existsSync('lib/templates/head.dot')) {
		var applicationHead = dot.template(fs.readFileSync('lib/templates/head.dot'));
		params.applicationHead = applicationHead(params);
	}
	if (fs.existsSync('lib/templates/body.dot')) {
		var applicationBody = dot.template(fs.readFileSync('lib/templates/body.dot'));
		params.applicationBody = applicationBody(params);
	}

	// Get the critical CSS from its file
	params.criticalCss = fs.readFileSync('build' + URLS.criticalCss);
}

module.exports = function(tollan) {
	dot.templateSettings.strip = !debug;

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
		criticalCss: '',
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

	var layout = dot.template(fs.readFileSync(__dirname + '/templates/layout.dot'));

	if (!debug) {
		loadApplicationLayout(genericLayoutParams);
	}

	return function(renderedReactString) {
		var layoutParams = extend(
			{element: renderedReactString},
			genericLayoutParams
		);

		if (debug) {
			loadApplicationLayout(layoutParams);
		}

		// Render our layout template and send that off
		var response = layout(layoutParams);

		if (debug) {
			// Pretty print HTML in debug
			response = styleHtml(response, {
				indent_size: 1,
				indent_char: '	',
				max_char: 120
			});
		}
		
		return response;
	};
};