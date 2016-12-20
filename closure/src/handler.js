
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
	var handler, args, fn;

	handler = new goog.ui.KeyboardShortcutHandler(window)
	handler.setAlwaysPreventDefault(false);
	args = [].slice.call(arguments);
	fn = args.pop();

	goog.array.forEach(args, function(shortcut) { handler.registerShortcut(shortcut, shortcut); });
	goog.events.listen(handler, goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED, function(e) {
		fn(e, e.identifier);
	});
}

