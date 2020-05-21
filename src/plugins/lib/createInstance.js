
import withContext from '../context'
import { withErrorCatch } from '../context'


export default function createInstance(pluginObj, plugin) {
	pluginObj.plugin = plugin;

	pluginObj.load = function() {
		pluginObj.loadWithPlugin(pluginObj.plugin);
	}

	pluginObj.loadWithPlugin = function(newPlugin=null) {
		pluginObj.destroy();

		pluginObj.plugin = null;
		pluginObj.instance = null;

		if (newPlugin) {
			pluginObj.plugin = newPlugin;
			pluginObj.instance = withContext(pluginObj.context, function() {
				return withErrorCatch('create plugin', pluginObj.plugin, pluginObj.pluginArguments());
			});
		}
	}

	pluginObj.destroy = function() {
		pluginObj.instance && pluginObj.instance();
	}
}
