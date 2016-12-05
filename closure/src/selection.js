
goog.module('selection');

goog.require('goog.dom.selection');


exports.setCursorAtEnd = function($element) {
	goog.dom.selection.setCursorPosition($element, $element.value.length);
}
