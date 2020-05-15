
import redboxWrapper from './redboxWrapper'
import withContext from '../context'


export default function createInstance(pluginObj, plugin) {
	pluginObj.plugin = plugin;

	pluginObj.load = function() {
		pluginObj.loadWithPlugin(pluginObj.plugin);
	}

	pluginObj.loadWithPlugin = function(newPlugin=null) {
		pluginObj.destroy();

		pluginObj.plugin = newPlugin;
		pluginObj.instance = null;
		pluginObj.plugin && redboxWrapper('createPlugin', pluginObj, function() {
			pluginObj.instance = withContext(pluginObj.context, function() {
				return pluginObj.plugin(...pluginObj.pluginArguments());
			});
		});
	}

	pluginObj.destroy = function() {
		pluginObj.instance && redboxWrapper('destroyPlugin', pluginObj, () => pluginObj.instance());
	}
}
