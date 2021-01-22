
goog.module('closure');

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

exports.style = goog.require('style');
exports.cssom = goog.require('cssom');
exports.animation = goog.require('animation');
exports.shortcuthandler = goog.require('shortcuthandler');
