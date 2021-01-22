
import { bindInternalSelector, loadInternalSelector } from '../lib/internalSelector'
import { loadData } from './scripts'
import clone from 'appgine/utils/clone'

import resolveDataAttribute from '../lib/resolveDataAttribute'

const internalBinders = [];
const loadedPlugins = [];


bindInternalSelector('[data-plugin]:not(noscript)', function($element, options) {
	resolveDataAttribute($element, 'data-plugin', function({ pluginName, pluginId, name, createData }) {
		for (let [createInstance, plugins] of internalBinders) {
			if (plugins[pluginName]) {
				const pluginArguments = () => [$element, createData(), pluginId];

				const context = { $element, pluginName, pluginId, name, options }
				const pluginObj = { context, $element, pluginArguments, pluginName, pluginId, name, options }
				createInstance(pluginObj, plugins[pluginName]);
				pluginObj.load();
				loadedPlugins.push(pluginObj);
				break;
			}
		}
	});
});


export default function createBinders(createInstance) {

	const plugins = {};
	const pluginsInstance = {};
	internalBinders.unshift([createInstance, pluginsInstance]);

	function createPlugin(name) {
		let reloaded = false;

		return {
			hotReload(newPlugin) {
				if (newPlugin) {
					reloaded = true;
					const oldPlugin = pluginsInstance[name];
					pluginsInstance[name] = newPlugin && newPlugin.default || newPlugin;
					return hotReload(name, oldPlugin, pluginsInstance[name]);
				}

				return this.willHotReload();
			},
			willHotReload() {
				reloaded = false;

				setTimeout(function() {
					if (reloaded===false) {
						const oldPlugin = pluginsInstance[name];
						delete pluginsInstance[name];
						delete plugins[name];
						hotReload(name, oldPlugin, null);
					}
				}, 0);
			},
		}
	}


	function bindPlugin(name, plugin)
	{
		plugins[name] = plugins[name] || createPlugin(name);
		plugins[name].hotReload(plugin);
		return plugins[name];
	}


	function bindSelector(selector, plugin, data)
	{
		const pluginName = '$' + selector;
		return createSelectorPlugin(createInstance, pluginName, selector, plugin, function($element) {
			return [$element, clone(data)];
		});
	}


	function bindAttribute(attrName, plugin)
	{
		const selector = '['+attrName+']';
		const pluginName = selector;
		return createSelectorPlugin(createInstance, pluginName, selector, plugin, function($element) {
			return [$element, loadData($element.getAttribute(attrName)||'')];
		});
	}

	return { bindPlugin, bindSelector, bindAttribute };
}


export function load($dom, options={})
{
	loadInternalSelector($dom, options);
}


export function unload($dom)
{
	const plugins = findPlugins(({ $element }) => $dom.contains($element));

	plugins.forEach(pluginObj => {
		if (loadedPlugins.indexOf(pluginObj)!==-1) {
			loadedPlugins.splice(loadedPlugins.indexOf(pluginObj), 1);
		}

		pluginObj.destroy();
	});
}


export function findPlugins(matches)
{
	return loadedPlugins.filter(matches);
}


function createSelectorPlugin(createInstance, pluginName, selector, plugin, createArguments) {
	plugin = plugin.default || plugin;

	const loader = bindInternalSelector(selector, function($element) {
		const pluginArguments = () => createArguments($element);
		const context = { $element, pluginName, options: {} }
		const pluginObj = { context, $element, plugin, pluginArguments, pluginName, options: {} }
		createInstance(pluginObj, plugin);
		pluginObj.load();
		loadedPlugins.push(pluginObj);
	});

	return {
		hotReload(newPlugin) {
			if (newPlugin) {
				const oldPlugin = plugin;
				plugin = newPlugin.default || newPlugin;
				return hotReload(pluginName, oldPlugin, plugin);
			}

			return this.willHotReload();
		},
		willHotReload() {
			const oldPlugin = plugin;
			plugin = null;
			hotReload(pluginName, oldPlugin, null);
			loader();
		},
	}
}


function hotReload(name, oldPlugin, newPlugin=null)
{
	const plugins = findPlugins(({ plugin, pluginName }) => pluginName===name && plugin===oldPlugin);
	plugins.forEach(pluginObj => pluginObj.loadWithPlugin(newPlugin));
}
