
export {
	load, unload,
	loadScripts, unloadScripts
} from '../plugins/loader'

export { swapDocument } from 'appgine/hooks/target'

import {
	findPlugins,
	load, unload,
	loadScripts, unloadScripts,
	loadSystem, unloadSystem,
} from '../plugins/loader'

import querySelectorAll from '../plugins/lib/querySelectorAll'
import resolveDataAttribute from '../plugins/lib/resolveDataAttribute'

import { addContainer, removeContainer } from 'appgine/hooks/target'
import { callUpdate } from 'appgine/hooks/update'
import { dom } from '../closure'


export function loadMain()
{
	loadSystem();
	loadScripts(document);
	loadStatic(document);
	unloadScripts(document);
}


export function unloadMain()
{
	unloadScripts(document);
	unloadStatic(document);
	unloadSystem();
}


export function loadStatic($dom)
{
	_loadPlugins($dom, 'static', 'static');
}


export function loadAtomic($dom, request)
{
	_loadPlugins($dom, 'atomic', request);
}


export function reloadStatic($dom)
{
	querySelectorAll($dom, '[data-static]').forEach(function($static) {
		const attr = $static.getAttribute('data-static');

		const update = [];
		querySelectorAll($static, '[data-plugin]').forEach(function($node) {
			resolveDataAttribute($node, 'data-plugin', function({ pluginName, pluginId, name, data }) {
				update[name + '::reload'] = data;
				update[name + '::reloadWithNode'] = { data, $node };
			});
		});

		const plugins = findPlugins(({ options }) => options.static===attr);
		updatePlugins(undefined, plugins, update);
	});
}


export function unloadStatic($dom)
{
	_unloadPlugins($dom, 'static', 'static');
}


export function unloadAtomic($dom, request)
{
	_unloadPlugins($dom, 'atomic', request);
}


export function update($dom, $element, data)
{
	const plugins = findPlugins(({ $element, options }) => dom.contains($dom, $element) || options.static);
	updatePlugins($element, plugins, data);
}


function updatePlugins($element, plugins, data) {
	let plugin = null;

	plugins.forEach(function(_plugin) {
		if ($element && dom.contains(_plugin.$element, $element)) {
			plugin = plugin || _plugin;

			if (dom.compareNodeOrder(_plugin.$element, plugin.$element)>=0) {
				plugin = _plugin;
			}
		}
	});

	Object.keys(data||{}).forEach(function(key) {
		const [, name, method='update'] = key.match(/^(.*?)(?:::(.+))?$/)||[];

		if (plugin && !name) {
			callUpdate(plugin, method, data[key]);
		}

		plugins.
			filter(val => val.pluginName===name || val.name===name).
			forEach(plugin => callUpdate(plugin, method, data[key]));
	});
}


function _loadPlugins($dom, type, container)
{
	querySelectorAll($dom, `[data-${type}]`).forEach(function($node) {
		load($node, {[type]: $node.getAttribute('data-' + type)||true});
		addContainer(container, $node);
	});
}


function _unloadPlugins($dom, type, container)
{
	querySelectorAll($dom, `[data-${type}]`).forEach(function($node) {
		removeContainer(container, $node);
		unload($node);
	});
}
