

export function parent(selector, create) {
	return function(plugin) {
		const pluginThis = this;
		this.createTargets(function(targets) {
			targets.parent(selector, function($element, target) {
				plugin.$parent = $element;
				plugin.parent = target;
				return pluginThis.createInstance(create, plugin);
			});
		});
	}
}
