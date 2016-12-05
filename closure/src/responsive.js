
goog.module('responsive');

goog.require('goog.dom');


exports.isMedium = function() {
	return goog.dom.getViewportSize().width>=48*16;
}
