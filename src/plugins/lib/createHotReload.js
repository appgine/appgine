
import notify from './notify'


export default function createHotReload(parentModule) {
	const plugins = [];

	if (parentModule && parentModule.hot) {
		parentModule.hot.dispose(function() {
			plugins.splice(0, plugins.length).forEach(plugin => plugin.willHotReload());
			notify("Plugins have been disposed.");
		});

		parentModule.hot.accept();
	}

	function hotReload(binder) {
		return function(plugin, ...args) {
			return createHotReloadAccept(binder, binder.name, plugin, args);
		}
	}

	function hotReloadName(binder) {
		return function(name, plugin, ...args) {
			return createHotReloadAccept(binder.bind(null, name), binder.name + "('"+name+"'')", plugin, args);
		}
	}

	function createHotReloadAccept(binder, pluginName, pluginId, args) {
		if (typeof pluginId!=='string' && typeof pluginId!=='number') {
			return binder(pluginId, ...args);
		}

		const plugin = __webpack_require__(pluginId);
		const pluginObj = binder(plugin, ...args);

		plugins.push(pluginObj);

		if (module.hot) {
			module.hot.accept(pluginId, function() {
				const $update = document.createElement('div');
				$update.textContent = "Plugin " + pluginName + " update detected. Reloading..";
				$update.style.padding = '6px 3px';

				notify($update);

				try {
					const plugin = __webpack_require__(pluginId);
					pluginObj.hotReload(plugin.default||plugin);
					$update.style.backgroundColor = "#33cc33";
					$update.textContent = "Plugin " + pluginName + " reloaded.";

				} catch (e) {
					$update.style.backgroundColor = "#cc0000";
					$update.textContent = "Plugin " + pluginName + " update failed ("+e.message+").";
					console.error(e, e.stack);
				}
			});
		}

		return pluginObj;
	}

	return { hotReload, hotReloadName }
}
