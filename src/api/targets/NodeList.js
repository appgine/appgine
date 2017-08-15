
import {
	findPlugins,
	querySelectorAll, resolveDataAttribute, contains,
} from 'plugin-macro-loader'

let targetId = 0;

export default class NodeList
{

	constructor() {
		this.$nodeList = [];
		this.plugins = [];
		this.targets = [];
	}

	isEmpty() {
		return this.$nodeList.length===0;
	}

	toArray() {
		return this.$nodeList.filter(() => true);
	}

	add($node) {
		if (this.$nodeList.indexOf($node)===-1) {
			this.$nodeList.push($node);

			const plugins = [];
			const targets = [];

			findPlugins($node).forEach(plugin => {
				const { $element, api, name } = plugin;
				api('targets', apiTargetsList => {
					plugins.push(plugin);

					this.targets.forEach(targetList => targetList.forEach(([id, target]) => {
						if (target.name===name) {
							apiTargetsList.forEach(apiTargets => apiTargets.addTarget(id, target));

						} else if (target.pluginName==='this' && contains($element, target.$element)) {
							apiTargetsList.forEach(apiTargets => apiTargets.addTarget(id, target));
						}
					}));

					this.$nodeList.forEach($node => {
						apiTargetsList.forEach(apiTargets => {
							findPluginTargets(apiTargets, $node).forEach(target => {
								const id = ++targetId;
								targets.push([id, target]);
								apiTargets.addTarget(id, target);
							});
						})
					});
				});

			});

			this.plugins.forEach(pluginList => pluginList.forEach(({ api }) => {
				api('targets', apiTargetsList => {
					apiTargetsList.forEach(apiTargets => {
						findPluginTargets(apiTargets, $node).forEach(target => {
							const id = ++targetId;
							targets.push([id, target]);
							apiTargets.addTarget(id, target);
						});
					});
				});

			}));

			this.plugins.push(plugins);

			findTargets($node).forEach(target => {
				const id = ++targetId;
				targets.push([id, target]);

				this.plugins.forEach(pluginList => pluginList.forEach(({ $element, api, name }) => {
					if (target.name===name) {
						api('targets', apiTargetsList => apiTargetsList.forEach(apiTargets => apiTargets.addTarget(id, target)));

					} else if (target.pluginName==='this' && contains($element, target.$element)) {
						api('targets', apiTargetsList => apiTargetsList.forEach(apiTargets => apiTargets.addTarget(id, target)));
					}
				}));
			});

			this.targets.push(targets);
		}
	}

	remove($node) {
		const index = this.$nodeList.indexOf($node);

		if (index!==-1) {
			this.targets[index].forEach(([id, target]) => {
				this.plugins.forEach(pluginList => pluginList.forEach(({ api }) => {
					api('targets', apiTargetsList => apiTargetsList.forEach(apiTargets => apiTargets.removeTarget(id)));
				}));
			});

			this.$nodeList.splice(index, 1);
			this.plugins.splice(index, 1);
			this.targets.splice(index, 1);
		}
	}

}


function findTargets($node)
{
	const targets = [];
	querySelectorAll($node, '[data-target]').forEach(function($element) {
		resolveDataAttribute($element, 'data-target', function(target) {
			targets.push(createTarget($element, target));
		});
	});

	return targets;
}


function findPluginTargets(apiTargets, $node)
{
	const targets = [];
	apiTargets._queries.forEach(function([target, query]) {
		Array.from($node.querySelectorAll(query)).forEach(function($element) {
			targets.push(createTarget($element, { target }));
		});
	});

	return targets;
}


function createTarget($element, target)
{
	const pluginList = findPlugins(plugin => plugin.$element===$element);

	const plugins = {};
	const plugin = pluginList.find(({ instance }) => instance);

	pluginList.forEach(function(plugin) {
		plugins[plugin.pluginName] = plugin;
	});

	return { $element, ...target, pluginList, plugins, plugin };
}
