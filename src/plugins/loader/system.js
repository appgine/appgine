
import clone from 'appgine/utils/clone'


let loaded = false;
const plugins = [];


export default function createBindSystem(createInstance) {
	return function(plugin, data) {
		const pluginObj = { context: {}, pluginArguments: () => [clone(data)] };

		createInstance(pluginObj, plugin, loaded)
		plugins.push(pluginObj);

		return {
			hotReload(newPlugin) {
				pluginObj.loadWithPlugin(newPlugin);
			},
			willHotReload() {
				pluginObj.destroy();

				if (plugins.indexOf(pluginObj)!==-1) {
					plugins.splice(plugins.indexOf(pluginObj), 1);
				}
			},
		}
	}
}


export function loadSystem()
{
	if (loaded===false) {
		loaded = true;
		plugins.forEach(pluginObj => pluginObj.load());
	}
}


export function unloadSystem()
{
	if (loaded) {
		loaded = false;
		plugins.forEach(pluginObj => pluginObj.destroy());
	}
}
