
/* Load fonts as quickly as possible, but also without blocking other stuff */
/* Original code by Adam Beres-Deak, modified by Paul Rayes */
/* https://github.com/bdadam/OptimizedWebfontLoading */

//This script must be placed in the HEAD above all external stylesheet declarations (link[rel=stylesheet])
(function f(modifiedDate) {
	// 0. Many unsupported browsers should stop here
	var nua = navigator.userAgent;

	if (
		!window.addEventListener // IE8 and below
		|| (nua.match(/(Android (2|3|4.0|4.1|4.2|4.3))|(Opera (Mini|Mobi))/) && !nua.match(/Chrome/)) // Android Stock Browser below 4.4 and Opera Mini
		) {
		return;
	}

	// 2. Setting up the <style> element, that we are using to apply the base64 encoded font data
	var styleElement = document.createElement('style');
	//styleElement.rel = 'stylesheet';
	document.head.appendChild(styleElement);
	// Setting styleElement.textContent must be after this line, because of IE9 errors

	// 5. Checking for WOFF2 support to know which URL we should use
	var url = '/fonts/fonts.woff' + (supportsWoff2() ? '2' : '') + '.css?' + modifiedDate;

	// 6. Fetching the font data from the server
	var request = new XMLHttpRequest();
	request.open('GET', url);
	request.onload = function() {
		if (request.status >= 200 && request.status < 400) {
			// 4. Applying the font style sheet
			styleElement.textContent = request.responseText;
		}
	};
	request.send();

	function supportsWoff2() {
		// Source: https://github.com/filamentgroup/woff2-feature-test
		if (!window.FontFace) {
			return false;
		}

		var f = new FontFace('t', 'url("data:application/font-woff2,") format("woff2")', {});
		var p = f.load();
		try {p.then(null, function(){});}catch(e){}
		return f.status === 'loading';
	}
})
