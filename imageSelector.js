/* 
Copyright 2013 Stu Kabakoff
https://github.com/sakabako/imageSelector
MIT Licensed
*/
(function(factory) {

	//AMD
	if(typeof define === 'function' && define.amd) {
		define(['jquery'], factory);

	//NODE
	} else if(typeof module === 'object' && module.exports) {
		module.exports = factory(require('jquery'));

	//GLOBAL
	} else {
		window.imageSelector = factory(jQuery);
	}

})(function($) {
	"use strict";

	var exports = {};

	var isRetina = ( window.devicePixelRatio && window.devicePixelRatio > 1.5 );

	var responsiveCallbacks = [];

	function addResponsiveCallback( callback ) {
		if (responsiveCallbacks.length === 0) {
			$(window).resize(function() {
				for (var i=0; i < responsiveCallbacks.length; i++) {
					responsiveCallbacks[i]();
				}
			})
		}
		responsiveCallbacks.push(callback);
	}

	function getStyle( el, styleProp ) {
		if (el.currentStyle) {
			var y = el.currentStyle[styleProp];
		} else if (window.getComputedStyle) {
			var y = document.defaultView.getComputedStyle(el,null).getPropertyValue(styleProp);
		}
		return y;
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
			}
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
			}
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
		for (var i = 0; i < cuts.length; i++) {
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
		var width = element.clientWidth;
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
				src = addAt2x(src);
			}
			element.setAttribute( srcAttribute, src );

		} else {
			$(element).addClass('no-cut-found');
			element.setAttribute( srcAttribute, '' );
		}


		
	};

	exports.selectImages = function( container, srcAttribute ) {
		$('img[data-cuts]', container).each(function( key, element ) {
			
			var cuts = JSON.parse(element.getAttribute('data-cuts'))
			element.removeAttribute('data-cuts');
	
			exports.addSource( element, srcAttribute, cuts );

			if (element.getAttribute('data-responsive') === 'true') {
				var currentWidth = element.offsetWidth;

				addResponsiveCallback(function() {
					if (element.offsetWidth !== currentWidth) {
						currentWidth = element.offsetWidth;
						console.log('reselecting');
						exports.addSource( element, srcAttribute, cuts );
					}
				});
			}

		});
	};

	return exports;
});