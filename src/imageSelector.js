/*
Copyright 2016 Stu Kabakoff
https://github.com/stutrek/imageSelector
MIT Licensed
*/

var events = require('add-event-listener');

var isRetina = ( window.devicePixelRatio && window.devicePixelRatio > 1.5 );

var responsiveCallbacks = [];

function addResponsiveCallback( callback ) {
	if (responsiveCallbacks.length === 0) {
		events.addEventListner(window, 'resize', function() {
			for (var i=0; i < responsiveCallbacks.length; i++) {
				responsiveCallbacks[i]();
			}
		});
	}
	responsiveCallbacks.push(callback);
}

function getStyle( el, styleProp ) {
	var y;
	if (el.currentStyle) {
		y = el.currentStyle[styleProp];
	} else if (window.getComputedStyle) {
		y = document.defaultView.getComputedStyle(el,null).getPropertyValue(styleProp);
	}
	return y;
}

function getWidth( element ) {
	var width = element.clientWidth;
	if (width === 0) {
		var widthStr = getStyle( element, 'width' );
		if (widthStr === 'auto') {
			width = getWidth( element.parentNode );
		} else if (widthStr.charAt(widthStr.length-1) === '%') {
			var percent = parseInt( widthStr, 10 );
			var parentWidth = getWidth( element.parentNode );
			width = parentWidth * (percent / 100);
		} else {
			width = parseInt( widthStr, 10 );
		}
	}
	return width;
}

function addAt2x( url ) {
	var indexOfDot = url.lastIndexOf('.');
	return url.substr(0, indexOfDot)+'@2x'+url.substr(indexOfDot);
}

function rateImage( imageWidth, desiredWidth ) {
	var ratio = imageWidth / desiredWidth;
	if (ratio < 1) {
		ratio = ratio / 2;
	}
	return Math.abs( 1 - ratio );
}

var aspectRatioCache = {};
function createFilterOnAspectRatio( aspectRatio ) {

	if (!aspectRatioCache[aspectRatio]) {
		aspectRatioCache[aspectRatio] = function( cut ) {
			return cut.aspectRatio === aspectRatio;
		};
	}

	return aspectRatioCache[aspectRatio];
}

var heightWidthCache = {};
function createFilterOnWidthAndHeight( width, height ) {
	var desiredAspectRatio = width / height;
	var ratioString = desiredAspectRatio.toString();

	if (!heightWidthCache[ratioString]) {
		heightWidthCache[ratioString] = function( cut ) {
			// if the cut is exactly the right ratio
			if (cut.width / cut.height === desiredAspectRatio) {
				return true;
			}
			// if adding one to the width is larger and subtracting one is smaller than the desired ratio
			if ( ((cut.width+1) / cut.height) >= desiredAspectRatio && ((cut.width-1) / cut.height) <= desiredAspectRatio) {
				return true;
			}
			return false;
		};
	}
	return heightWidthCache[ratioString];
}

exports.selectCutWithAspectRatio = function( cuts, desiredWidth, aspectRatio, worstAccepableScore ) {
	cuts = cuts.filter( createFilterOnAspectRatio( aspectRatio ) );
	return exports.selectCut( cuts, desiredWidth, worstAccepableScore);
};

exports.selectCutWithWidthAndHeight = function( cuts, desiredWidth, desiredHeight, worstAccepableScore ) {
	cuts = cuts.filter( createFilterOnWidthAndHeight( desiredWidth, desiredHeight) );
	return exports.selectCut( cuts, desiredWidth, worstAccepableScore);
};

exports.selectCut = function( cuts, desiredWidth, worstAccepableScore ) {
	if (worstAccepableScore === undefined) {
		worstAccepableScore = 0.75;
	}

	var cutToUse, bestScore = Infinity;
	for (var i in cuts) {
		var cut = cuts[i];

		if (desiredWidth === cut.width) {
			return cut;
		}
		var score = rateImage( cut.width, desiredWidth );
		if (score < worstAccepableScore) {
			if (score < bestScore) {
				cutToUse = cut;
				bestScore = score;
			}
		}
	}
	return cutToUse;
};

exports.addSource = function( element, srcAttribute, cuts ) {
	srcAttribute = srcAttribute || 'src';

	cuts = cuts || JSON.parse(element.getAttribute('data-cuts'));
	var width = getWidth( element );
	var height;
	var aspectRatio = element.getAttribute('data-aspect-ratio');

	if (element.attributes.height && element.attributes.height.specified) {
		height = element.height;
	} else {
		height = getStyle( element, 'height' );
	}

	height = parseInt(height, 10);

	srcAttribute = element.getAttribute('data-src-attribute') || srcAttribute;

	// make sure it's not a missing image icon
	if (height < 30) {
		height = false;
	}

	var cut;
	if (aspectRatio) {
		cut = exports.selectCutWithAspectRatio( cuts, width, aspectRatio );
	} else if (height) {
		cut = exports.selectCutWithWidthAndHeight( cuts, width, height );
	} else {
		cut = exports.selectCut( cuts, width );
	}

	if (cut) {
		var src = cut.src;
		if (isRetina && cut.at2x && cut.width < width*1.5) {
			if (typeof cut.at2x === 'string') {
				src = cut.at2x;
			} else {
				src = addAt2x(src);
			}
		}
		element.setAttribute( srcAttribute, src );

	} else {
		element.className += ' no-cut-found';
		element.setAttribute( srcAttribute, '' );
	}
};

exports.selectImages = function( container, srcAttribute ) {
	container = container || document.body;
	var elements = container.querySelectorAll('img[data-cuts]');
	var element;
	for (var i = 0; i < elements.length; i++) {
		element = elements[i];

		try {
			var cuts = JSON.parse(element.getAttribute('data-cuts'));
			element.removeAttribute('data-cuts');

			exports.addSource( element, srcAttribute, cuts );

			if (element.getAttribute('data-responsive') === 'true') {
				var currentWidth = element.offsetWidth;

				addResponsiveCallback(function() {
					if (element.offsetWidth !== currentWidth) {
						currentWidth = element.offsetWidth;
						exports.addSource( element, srcAttribute, cuts );
					}
				});
			}
		} catch (e) {
			console && console.error && console.error(e);
		}

	}
};
