
export { loadScripts, unloadScripts } from './loader/scripts'
export { load, unload, findPlugins } from './loader/selector'
export { loadSystem, unloadSystem } from './loader/system'

import createBindSystem from './loader/system'
import createBinders from './loader/selector'
import createInstance from './lib/createInstance'
import createHotReload from './lib/createHotReload'

const bindSystem = createBindSystem(createInstance);
const { bindPlugin, bindSelector, bindAttribute } = createBinders(createInstance);


export default function createLoader(...args) {
	const fn = args.pop();
	const { hotReload, hotReloadName } = createHotReload(...args);

	fn({
		bindSystem: hotReload(patchBinder(bindSystem)),
		bindPlugin: hotReloadName(patchBinderName(bindPlugin)),
		bindSelector: hotReloadName(patchBinderName(bindSelector)),
		bindAttribute: hotReloadName(patchBinderName(bindAttribute)),
	});
}


function patchBinder(binder) {
	return function(plugin, ...args) {
		return binder(plugin&&plugin.default||plugin, ...args);
	}
}


function patchBinderName(binder) {
	return function(name, plugin, ...args) {
		return binder(name, plugin&&plugin.default||plugin, ...args);
	}
}
