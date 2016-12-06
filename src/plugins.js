
export {
	command, commandAll
} from 'plugin-macro-loader/lib/loader'

import {
	reloadTargets
} from './api/targets/container'

import {
	loader as _loader,
	loaderGlobal as _loaderGlobal,
} from 'plugin-macro-loader/webpack'


export function loader(module, fn) {
	return createLoader(_loader, module, fn);
}


export function loaderGlobal(module, fn) {
	return createLoader(_loaderGlobal, module, fn);
}


function createLoader(loader, module, fn) {
	loader(module, function(binders) {
		const _binders = {};
		Object.keys(binders).map(function(key) {
			_binders[key] = (...args) => patchHotReload(binders[key](...args));
		});

		fn(_binders);
	});
}


function patchHotReload(pluginObj)
{
	if (pluginObj && pluginObj.hotReload) {
		const hotReload = pluginObj.hotReload;

		pluginObj.hotReload = function(...args) {
			reloadTargets(function() {
				hotReload(...args);
			});
		}
	}

	return pluginObj;
}
