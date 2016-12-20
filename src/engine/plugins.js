
export {
	load, unload,
	loadScripts, unloadScripts, loadGlobal
} from 'plugin-macro-loader/lib/loader'

import {
	findPlugins,
	load, unload,
	loadScripts, unloadScripts,
	loadGlobal, loadSystem,
	updatePlugins, updatePlugin,
	querySelectorAll, resolveDataAttribute, contains,
} from 'plugin-macro-loader/lib/loader'

import {
	getTargetsContainer,
	reloadTargets, completeTargets,
} from '../api/targets/container'

import closure from '../closure'


export function swapDocument(fn)
{
	getTargetsContainer('document').remove(document);
	fn && fn();
	getTargetsContainer('document').add(document);
	completeTargets();
}


export function loadMain()
{
	loadSystem();
	loadScripts(document);
	loadGlobal(document);
	loadStatic(document);
	unloadScripts(document);
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
		updatePlugins(plugins, update);
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
	let plugin = null;

	plugins.forEach(function(_plugin) {
		if (contains(_plugin.$element, $element)) {
			plugin = plugin || _plugin;

			if (closure.dom.compareNodeOrder(_plugin.$element, plugin.$element)>=0) {
				plugin = _plugin;
			}
		}
	});

	updatePlugins(plugins, data);
	updatePlugin(plugin, data);
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
