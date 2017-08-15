
export {
	load, unload,
	loadScripts, unloadScripts, loadGlobal
} from 'plugin-macro-loader/lib/loader'

import {
	findPlugins,
	load, unload,
	loadScripts, unloadScripts,
	loadGlobal, unloadGlobal,
	loadSystem, unloadSystem,
	updateGlobal,
	querySelectorAll, resolveDataAttribute, contains,
} from 'plugin-macro-loader/lib/loader'

export { swapDocument } from '../api/targets/container'
import { getTargetsContainer } from '../api/targets/container'

import closure from '../closure'


export function loadMain()
{
	loadSystem();
	loadScripts(document);
	loadGlobal(document);
	loadStatic(document);
	unloadScripts(document);
}


export function unloadMain()
{
	unloadScripts(document);
	unloadStatic(document);
	unloadGlobal(document);
	unloadSystem();
}


/**
 * @param {Element}
 */
export function loadStatic($dom)
{
	_loadPlugins($dom, 'static', getTargetsContainer('static'));
}


/**
 * @param {Element}
 * @param {Object}
 */
export function loadAtomic($dom, request)
{
	_loadPlugins($dom, 'atomic', getTargetsContainer(request));
}


/**
 * @param {Element}
 */
export function reloadStatic($dom)
{
	querySelectorAll($dom, '[data-static]').forEach(function($static) {
		const attr = $static.getAttribute('data-static');

		const update = [];
		querySelectorAll($static, '[data-plugin]').forEach(function($node) {
			resolveDataAttribute($node, 'data-plugin', function({ pluginName, pluginId, name, data }) {
				update[name + '::reload'] = data;
			});
		});

		const plugins = findPlugins(({ options }) => options.static===attr);
		updatePlugins(undefined, plugins, update);
	});
}


/**
 * @param {Element}
 */
export function unloadStatic($dom)
{
	_unloadPlugins($dom, 'static', getTargetsContainer('static'));
}


/**
 * @param {Element}
 * @param {Object}
 */
export function unloadAtomic($dom, request)
{
	_unloadPlugins($dom, 'atomic', getTargetsContainer(request));
}


/**
 * @param {Element}
 * @param {Element}
 * @param {object}
 */
export function update($dom, $element, data)
{
	const plugins = findPlugins(({ $element, options }) => contains($dom, $element) || options.static);
	updatePlugins($element, plugins, data);
}


function updatePlugins($element, plugins, data) {
	let plugin = null;

	plugins.forEach(function(_plugin) {
		if ($element && contains(_plugin.$element, $element)) {
			plugin = plugin || _plugin;

			if (closure.dom.compareNodeOrder(_plugin.$element, plugin.$element)>=0) {
				plugin = _plugin;
			}
		}
	});

	Object.keys(data||{}).forEach(function(key) {
		const [, name, method='update'] = key.match(/^(.*?)(?:::(.+))?$/)||[];

		updateGlobal(name, data[key]);

		if (plugin && !name) {
			updatePlugin(plugin, method, data[key]);
		}

		plugins.
			filter(val => val.pluginName===name || val.name===name).
			forEach(plugin => updatePlugin(plugin, method, data[key]));
	});
}


function updatePlugin(plugin, method, data) {
	const [, targetId, targetMethod] = method.match(/^(.+?)\.(.+)$/)||[];

	(plugin.api('update')||[]).forEach(apiUpdate => {
		if (apiUpdate && apiUpdate[method]) {
			apiUpdate[method](data);
		}
	});

	if (plugin && plugin.instance && plugin.instance[method]) {
		plugin.instance[method](data);
	}

	(plugin.api('targets')||[]).forEach(apiTargets => {
		apiTargets.findAll('', function(target) {
			(target.instances||[]).forEach(instance => {
				if (instance && instance[method]) {
					instance[method](data);
				}

				if (target.id===targetId && instance && instance[targetMethod]) {
					instance[targetMethod](data);
				}
			});
		});
	});

	(plugin.api('targets')||[]).forEach(apiTargets => {
		apiTargets._complete.forEach(function(complete) {
			if (complete.result && complete.result[method]) {
				complete.result[method](data);
			}
		});
	});

	(plugin.api('targets')||[]).forEach(apiTargets => {
		apiTargets._document.forEach(function(complete) {
			if (complete.result && complete.result[method]) {
				complete.result[method](data);
			}
		});
	});
}


function _loadPlugins($dom, type, targets)
{
	querySelectorAll($dom, `[data-${type}]`).forEach(function($node) {
		load($node, {[type]: $node.getAttribute('data-' + type)||true});
		targets.add($node);
	});
}


function _unloadPlugins($dom, type, targets)
{
	querySelectorAll($dom, `[data-${type}]`).forEach(function($node) {
		targets.remove($node);
		unload($node);
	});
}
