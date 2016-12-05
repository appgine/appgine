
goog.module('rect')

goog.require('goog.dom');
goog.require('goog.math.Rect');

var scrollTop = goog.require('scroll').scrollTop;
var scrollLeft = goog.require('scroll').scrollLeft;


exports.fromScreen = function() {
	var viewport = goog.dom.getViewportSize();
	return new goog.math.Rect(
		scrollLeft(), scrollTop(),
		viewport.width, viewport.height
	);
}


exports.intersection = goog.math.Rect.intersection;
