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
		var jQuery = require('jquery');
		module.exports = factory(jQuery);

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

	exports.selectImage = function( cuts, desiredWidth, aspectRatio ) {
		var cutToUse, bestSizeDifference = Infinity;
		for (var i = 0; i < cuts.length; i++) {
			var cut = cuts[i];
			if (!aspectRatio || cut.aspectRatio === aspectRatio) {
				var currentSizeDifference = Math.abs(cut.width-desiredWidth);
				if (currentSizeDifference < bestSizeDifference) {
					cutToUse = cut;
					bestSizeDifference = currentSizeDifference;
					if (currentSizeDifference === 0) {
						return cut;
					}
				}
			}
		}
		return cut;
	};

	exports.addSource = function( element, srcAttribute ) {
		srcAttribute = srcAttribute || 'src';
		
		var cuts = JSON.parse(element.getAttribute('data-cuts'));
		var width = element.offsetWidth;
		var aspectRatio = element.getAttribute('data-aspect-ratio');

		var cut = exports.selectImage( cuts, width, aspectRatio );

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
});