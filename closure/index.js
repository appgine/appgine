
goog.module('closure');

goog.require('goog.labs.userAgent.browser');
goog.require('goog.dom');
goog.require('goog.math.Coordinate');

goog.dom.getDocumentScroll_ = function(doc) {
	return new goog.math.Coordinate(
		Math.max(
			window.pageXOffset||0,
			window.scrollX||0,
			doc.body.scrollLeft||0,
			doc.documentElement ?doc.documentElement.scrollLeft||0 : 0
		),
		Math.max(
			window.pageYOffset||0,
			window.scrollY||0,
			doc.body.scrollTop||0,
			doc.documentElement ?doc.documentElement.scrollTop||0 : 0
		)
	);
}

exports.dispose = goog.require('dispose').dispose;

exports.cloneObject = goog.cloneObject;
exports.getUid = goog.getUid;
exports.typeOf = goog.typeOf;
exports.isDef = goog.isDef;
exports.isDefAndNotNull = goog.isDefAndNotNull;
exports.isNull = goog.isNull;
exports.isNumber = goog.isNumber;
exports.isString = goog.isString;
exports.isArray = goog.isArray;
exports.isArrayLike = goog.isArrayLike;
exports.isObject = goog.isObject;
exports.isFunction = goog.isFunction;
exports.isDateLike = goog.isDateLike;
exports.isElement = goog.dom.isElement;

exports.browser = {};
exports.browser.isChrome = goog.labs.userAgent.browser.isChrome;
exports.browser.isFirefox = goog.labs.userAgent.browser.isFirefox;
exports.browser.isSafari = goog.labs.userAgent.browser.isSafari;
exports.browser.isOpera = goog.labs.userAgent.browser.isOpera;
exports.browser.isIE = goog.labs.userAgent.browser.isIE;
exports.browser.isAndroidBrowser = goog.labs.userAgent.browser.isAndroidBrowser;

exports.string = goog.require('string');
exports.base64 = goog.require('base64');
exports.array = goog.require('array');
exports.style = goog.require('style');
exports.object = goog.require('object');
exports.dom = goog.require('dom');
exports.cssom = goog.require('cssom');
exports.classes = goog.require('classes');
exports.scrollLeft = goog.require('scroll').scrollLeft;
exports.scrollTop = goog.require('scroll').scrollTop;
exports.scrollHeight = goog.require('scroll').scrollHeight;
exports.scrollWidth = goog.require('scroll').scrollWidth;
exports.animation = goog.require('animation');
exports.ajax = goog.require('ajax');
exports.form = goog.require('form');
exports.autocomplete = goog.require('autocomplete');
exports.scroll = goog.require('scroll');
exports.shortcuthandler = goog.require('handler').shortcut;
exports.blur = goog.require('blur');
exports.uri = goog.require('uri');
exports.imageloader = goog.require('imageloader');
exports.rect = goog.require('rect');
exports.cookies = goog.require('cookies');
exports.selection = goog.require('selection');
exports.responsive = goog.require('responsive');
