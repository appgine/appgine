
export {
	command, commandAll
} from 'plugin-macro-loader/lib/loader'

import {
	reloadTargets
} from './api/targets/container'

import {
	loader as _loader,
	loaderGlobal as _loaderGlobal,
} from 'plugin-macro-loader'

import {
	loader as _hotLoader,
	loaderGlobal as _hotLoaderGlobal,
} from 'plugin-macro-loader/webpack'


export function loader(module, fn) {
	if (fn===undefined) {
		return createLoader(_loader, module);

	} else {
		return createLoader(_hotLoader.bind(null, module), fn);
	}
}


export function loaderGlobal(module, fn) {
	if (fn===undefined) {
		return createLoader(_loaderGlobal, module);

	} else {
		return createLoader(_hotLoaderGlobal.bind(null, module), fn);
	}
}


function createLoader(loader, fn) {
	loader(function(binders) {
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
