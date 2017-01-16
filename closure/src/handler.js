
goog.module('handler');

goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.KeyHandler');
goog.require('goog.events.KeyHandler.EventType');
goog.require('goog.ui.KeyboardShortcutHandler');
goog.require('goog.ui.KeyboardShortcutHandler.EventType');


exports.keycut = function($element, handle, capture) {
	goog.events.listen(new goog.events.KeyHandler($element), goog.events.KeyHandler.EventType.KEY, handle, capture);
}


exports.shortcut = function() {
	var register, args;

	args = [].slice.call(arguments);
	register = exports.createHandler(args.pop());
	goog.array.forEach(args, function(shortcut) { register(shortcut, shortcut); });

	return register;
}


exports.createHandler = function(fn) {
	var handler;

	handler = new goog.ui.KeyboardShortcutHandler(window)
	handler.setAlwaysPreventDefault(false);
	handler.setAllShortcutsAreGlobal(true);

	goog.events.listen(handler, goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED, function(e) {
		handler.setAllShortcutsAreGlobal(false);
		var isValid = handler.isValidShortcut_(e);
		handler.setAllShortcutsAreGlobal(true);

		return fn(e, e.identifier, isValid);
	});

	return function(shortcut) {
		if (handler.isShortcutRegistered(shortcut)===false) {
			handler.registerShortcut(shortcut, shortcut);
		}
	}
}
