
goog.module('style');

goog.require('goog.style');

exports.getSize = goog.style.getSize;
exports.getBounds = goog.style.getBounds;
exports.getMarginBox = goog.style.getMarginBox;
exports.getPageOffsetTop = goog.style.getPageOffsetTop;
exports.getPageOffsetLeft = goog.style.getPageOffsetLeft;


exports.isOverflow = function($node) {

	return $node.style.overflow==='hidden'
		|| goog.style.getComputedOverflowX($node)==='hidden'
		|| goog.style.getComputedOverflowY($node)==='hidden';
}


exports.isVisible = function($node) {
	var position = goog.style.getComputedPosition($node);

	if (position==='absolute' || position==='fixed') {
		return false;
	}

	var visibility = goog.style.getStyle_($node, 'visibility');
	var display = goog.style.getStyle_($node, 'display');

	if (display==='none') {
		return false;

	} else if (visibility==='hidden') {
		return false;

	} else if ($node.children.length===0) {
		var size = goog.style.getSize($node);

		if (size.width===0 || size.height===0) {
			return false;
		}
	}

	return true;
}
