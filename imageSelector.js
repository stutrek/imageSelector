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

	function addAt2x( url ) {
		var indexOfDot = url.lastIndexOf('.');
		return url.substr(0, indexOfDot)+'@2x'+url.substr(indexOfDot);
	}

	exports.selectCut = function( cuts, desiredWidth, aspectRatio ) {
		var cutToUse, bestRatioDiff = Infinity;
		for (var i = 0; i < cuts.length; i++) {
			var cut = cuts[i];
			if (!aspectRatio || cut.aspectRatio === aspectRatio) {
				
				if (desiredWidth === cut.width) {
					return cut;
				}

				var sizeRatio = cut.width / desiredWidth;
				console.log(sizeRatio);
				if (sizeRatio >= 0.5 && sizeRatio <= 2) {
					var ratioDiff = Math.abs(sizeRatio - 1);
					if (ratioDiff < bestRatioDiff) {
						cutToUse = cut;
						bestRatioDiff = ratioDiff;
					}
				}
			}
		}
		return cutToUse;
	};

	exports.addSource = function( element, srcAttribute ) {
		srcAttribute = srcAttribute || 'src';
		
		var cuts = JSON.parse(element.getAttribute('data-cuts'));
		var width = element.clientWidth;
		var aspectRatio = element.getAttribute('data-aspect-ratio');

		srcAttribute = element.getAttribute('data-src-attribute') || srcAttribute;

		var cut = exports.selectCut( cuts, width, aspectRatio );

		if (cut) {
			var src = cut.src;
			if (isRetina && cut.at2x && cut.width < width*1.5) {
				src = addAt2x(src);
			}
			element.setAttribute( srcAttribute, src );

		} else {
			element.className += ' no-cut-found';
		}

		element.removeAttribute('data-cuts');
		
	};

	exports.selectImages = function( container, srcAttribute ) {
		$('img[data-cuts]', container).each(function( key, element ) {
			exports.addSource( element, srcAttribute );
		});
	};

	return exports;
});