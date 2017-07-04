
goog.module('blur');

goog.require('dispose');
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

function onKeyDown(e) {
	if (e.keyCode===goog.events.KeyCodes.ENTER) {
		_enter = true;
	}
}

function onKeyUp(e) {
	if (e.keyCode===goog.events.KeyCodes.ENTER) {
		_enter = false;
	}
}

function onBlur(e) {
	_enter = false;
}


goog.events.listen(window, goog.events.EventType.KEYDOWN, onKeyDown);
goog.events.listen(window, goog.events.EventType.KEYUP, onKeyUp);
goog.events.listen(window, goog.events.EventType.BLUR, onBlur);


dispose.register(function() {
	goog.events.unlisten(window, goog.events.EventType.KEYDOWN, onKeyDown);
	goog.events.unlisten(window, goog.events.EventType.KEYUP, onKeyUp);
	goog.events.unlisten(window, goog.events.EventType.BLUR, onBlur);
});
