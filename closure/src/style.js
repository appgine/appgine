
goog.module('style');

goog.require('goog.style');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.style.transform');
goog.require('goog.fx.css3.Transition');
goog.require('goog.userAgent');

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

installStyles('._computedSizeClearfix:before, ._computedSizeClearfix:after { content: " "; visibility: hidden; display: block !important; height: 0; } ._computedSizeClearfix:after { clear: both; }');

exports.getComputedSize = function($node) {
	goog.dom.classes.add($node, '_computedSizeClearfix');
	var size = goog.style.getSize($node);
	goog.dom.classes.remove($node, '_computedSizeClearfix');

	return size;
}


function installStyles(stylesString, opt_node) {
	var dh = goog.dom.getDomHelper(opt_node);
	var styleSheet = null;

	// IE < 11 requires createStyleSheet. Note that doc.createStyleSheet will be
	// undefined as of IE 11.
	var doc = dh.getDocument();
	if (goog.userAgent.IE && doc.createStyleSheet) {
		styleSheet = doc.createStyleSheet();
		setStyles(styleSheet, stylesString);
	} else {
		var head = dh.getElementsByTagNameAndClass(goog.dom.TagName.HEAD)[0];

		// In opera documents are not guaranteed to have a head element, thus we
		// have to make sure one exists before using it.
		if (!head) {
			var body = dh.getElementsByTagNameAndClass(goog.dom.TagName.BODY)[0];
			head = dh.createDom(goog.dom.TagName.HEAD);
			body.parentNode.insertBefore(head, body);
		}
		styleSheet = dh.createDom(goog.dom.TagName.STYLE);
		// NOTE(user): Setting styles after the style element has been appended
		// to the head results in a nasty Webkit bug in certain scenarios. Please
		// refer to https://bugs.webkit.org/show_bug.cgi?id=26307 for additional
		// details.
		setStyles(styleSheet, stylesString);
		dh.appendChild(head, styleSheet);
	}
	return styleSheet;
}


function setStyles(element, stylesString) {
	if (goog.userAgent.IE && goog.isDef(element.cssText)) {
		// Adding the selectors individually caused the browser to hang if the
		// selector was invalid or there were CSS comments. Setting the cssText of
		// the style node works fine and ignores CSS that IE doesn't understand.
		// However IE >= 11 doesn't support cssText any more, so we make sure that
		// cssText is a defined property and otherwise fall back to setTextContent.
		element.cssText = stylesString;
	} else {
		// NOTE: We could also set textContent directly here.
		goog.dom.setTextContent(/** @type {!Element} */ (element), stylesString);
	}
}
