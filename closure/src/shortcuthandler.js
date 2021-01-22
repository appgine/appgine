
goog.module('shortcuthandler');

goog.require('goog.events');
goog.require('goog.events.KeyHandler');
goog.require('goog.events.KeyHandler.EventType');
goog.require('goog.ui.KeyboardShortcutHandler');
goog.require('goog.ui.KeyboardShortcutHandler.EventType');

exports = function() {
	var args = Array.from(arguments);
	var fn = args.pop();
	var handler = new goog.ui.KeyboardShortcutHandler(window);

	handler.setAlwaysPreventDefault(false);
	handler.setAllShortcutsAreGlobal(true);

	goog.events.listen(handler, goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED, function(e) {
		handler.setAllShortcutsAreGlobal(false);
		var isValid = handler.isValidShortcut_(e);
		handler.setAllShortcutsAreGlobal(true);

		goog.exportProperty(e, 'preventDefault', e.preventDefault);
		goog.exportProperty(e, 'stopPropagation', e.stopPropagation);

		return fn(e, e.identifier, isValid);
	});

	function register(shortcut) {
		if (handler.isShortcutRegistered(shortcut)===false) {
			handler.registerShortcut(shortcut, shortcut);
		}
	}

	register['dispose'] = function() {
		handler.dispose();
	}

	args.forEach(register);
	return register;
}
