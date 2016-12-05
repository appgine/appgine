
goog.module('blur');

goog.require('goog.events');
goog.require('goog.events.KeyCodes');
goog.require('goog.events.EventType');


var _enter = false;

exports.fromEvent = function(e) {
	exports.fromElement(e.target);
}

exports.fromElement = function($el) {
	var $el = goog.dom.getAncestorByTagNameAndClass($el, 'a')
		|| goog.dom.getAncestorByTagNameAndClass($el, 'button');

	if ($el && _enter===false) {
		$el.blur();
	}
}


goog.events.listen(window, goog.events.EventType.KEYDOWN, function(e) {
	if (e.keyCode===goog.events.KeyCodes.ENTER) {
		_enter = true;
	}
});

goog.events.listen(window, goog.events.EventType.KEYUP, function(e) {
	if (e.keyCode===goog.events.KeyCodes.ENTER) {
		_enter = false;
	}
});

goog.events.listen(window, goog.events.EventType.BLUR, function(e) {
	_enter = false;
});
