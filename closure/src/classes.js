
goog.module('classes');

goog.require('goog.dom.classes');


exports.has = goog.dom.classes.has;
exports.add = goog.dom.classes.add;
exports.remove = goog.dom.classes.remove;
exports.enable = goog.dom.classes.enable;
exports.toggle = goog.dom.classes.toggle;
exports.addRemove = goog.dom.classes.addRemove;
exports.swap = function(selector, $from, $into) {
	goog.dom.classes.addRemove(
		document.querySelector(selector),
		goog.dom.classes.get($from.querySelector(selector)),
		goog.dom.classes.get($into.querySelector(selector))
	);
}
