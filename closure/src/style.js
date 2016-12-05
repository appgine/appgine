
goog.module('style');

goog.require('goog.style');
goog.require('goog.dom.classes');
goog.require('goog.style.transform');
goog.require('goog.fx.css3.Transition');

exports.getSize = goog.style.getSize;
exports.setStyle = goog.style.setStyle;
exports.getBounds = goog.style.getBounds;
exports.getMarginBox = goog.style.getMarginBox;
exports.getPaddingBox = goog.style.getPaddingBox;
exports.getPageOffsetTop = goog.style.getPageOffsetTop;
exports.getPageOffsetLeft = goog.style.getPageOffsetLeft;
exports.getOffsetParent = goog.style.getOffsetParent;
exports.scrollIntoContainerView = goog.style.scrollIntoContainerView;
exports.getContainerOffsetToScrollInto = goog.style.getContainerOffsetToScrollInto;


exports.setTranslation = function(element, x, y) {
	return goog.style.transform.setTranslation(element, Math.floor(x), Math.floor(y));
}


exports.translateY = function($element, from, to, duration, animation) {
	var transition = new goog.fx.css3.Transition($element, duration/1000,
		{'transform': from ? 'translate3d(0, '+Math.floor(from)+'px, 0)' : ''},
		{'transform': to ? 'translate3d(0, '+Math.floor(to)+'px, 0)' : ''},
		goog.style.getVendorStyleName_($element, 'transform') + ' ' + animation
	);

	transition.play();
}


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
	var display    = goog.style.getStyle_($node, 'display');

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

goog.style.installStyles('._computedSizeClearfix:before, ._computedSizeClearfix:after { content: " "; visibility: hidden; display: block !important; height: 0; } ._computedSizeClearfix:after { clear: both; }');

exports.getComputedSize = function($node) {
	goog.dom.classes.add($node, '_computedSizeClearfix');
	var size = goog.style.getSize($node);
	goog.dom.classes.remove($node, '_computedSizeClearfix');

	return size;
}
