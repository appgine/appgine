
import 'es5-shim/es5-shim'
import 'es5-shim/es5-sham'
import 'core-js/modules/es6.promise'
import 'core-js/modules/es6.symbol'
import 'core-js/modules/es6.array.iterator'
import 'core-js/modules/es6.array.from'
import 'core-js/modules/es6.array.find'
import 'core-js/modules/es6.array.find-index'
import 'core-js/modules/es6.object.assign'
import 'core-js/modules/es7.object.values'
import 'core-js/modules/es7.object.entries'
import 'core-js/modules/es7.array.includes'
import 'core-js/modules/es7.string.pad-start'
import 'babel-regenerator-runtime'
import 'classlist-polyfill'


if (document.contains===undefined) {
	document.contains = function($descendant) {
		return document===$descendant
			|| (document.body && document.body.contains($descendant))
			|| (document.head && document.head.contains($descendant));
	}
}


(function() {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};

	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};

	if (!window.requestIdleCallback) {
		window.requestIdleCallback = window.requestAnimationFrame;
		window.cancelIdleCallback = window.cancelAnimationFrame;
	}
}());


(function() {
	if (!Element.prototype.matches) {
		Element.prototype.matches =
			Element.prototype.matchesSelector ||
			Element.prototype.mozMatchesSelector ||
			Element.prototype.msMatchesSelector ||
			Element.prototype.oMatchesSelector ||
			Element.prototype.webkitMatchesSelector ||
			function(s) {
				var matches = (this.document || this.ownerDocument).querySelectorAll(s),
					i = matches.length;
				while (--i >= 0 && matches.item(i) !== this) {}
				return i > -1;
		};
  }
})();
