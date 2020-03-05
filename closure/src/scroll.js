
goog.module('scroll');

goog.require('goog.dom');


exports.getDocumentScrollElement = goog.dom.getDocumentScrollElement;


var doc = document;
var docEl = doc.documentElement||{};

var scrollTop;
var scrollLeft;
var scrollHeight;
var scrollWidth;

window.addEventListener('scroll', function(e) {
	scrollTop = Math.max(window.pageYOffset||0, window.scrollY||0, doc.body.scrollTop||0, docEl.scrollTop||0);
	scrollLeft = Math.max(window.pageXOffset||0, window.scrollX||0, doc.body.scrollLeft||0, docEl.scrollLeft||0);
	scrollHeight = Math.max(doc.body.scrollHeight||0, docEl.scrollHeight||0) - goog.dom.getViewportSize().height;
	scrollWidth = Math.max(doc.body.scrollWidth||0, docEl.scrollWidth||0) - goog.dom.getViewportSize().width;
});

exports.scrollTo = function() {
	scrollTop, scrollLeft, scrollHeight, scrollWidth = undefined;
	window.scrollTo.apply(window, arguments);
}

exports.scrollTop = function() {
	if (scrollTop===undefined) {
		scrollTop = Math.max(window.pageYOffset||0, window.scrollY||0, doc.body.scrollTop||0, docEl.scrollTop||0);
	}
	return scrollTop;
}

exports.scrollLeft = function() {
	if (scrollLeft===undefined) {
		scrollLeft = Math.max(window.pageXOffset||0, window.scrollX||0, doc.body.scrollLeft||0, docEl.scrollLeft||0);
	}
	return scrollLeft;
}

exports.scrollHeight = function() {
	if (scrollHeight===undefined) {
		scrollHeight = Math.max(doc.body.scrollHeight||0, docEl.scrollHeight||0) - goog.dom.getViewportSize().height;
	}
	return scrollHeight;
}

exports.scrollWidth = function() {
	if (scrollWidth===undefined) {
		scrollWidth = Math.max(doc.body.scrollWidth||0, docEl.scrollWidth||0) - goog.dom.getViewportSize().width;
	}
	return scrollWidth;
}
