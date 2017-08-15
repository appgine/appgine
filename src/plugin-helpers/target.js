

export function target(name, create) {
	return function(plugin) {
		const pluginThis = this;
		this.createTargets(function(targets) {
			targets.first(name, function(target) {
				const { $element } = target;
				plugin.$target = $element;
				plugin.target = target;

				const instance = create.call(pluginThis, plugin);
				return pluginThis.update(instance);
			});
		});
	}
}
