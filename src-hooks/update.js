

import { useContext, bindContext } from 'appgine/hooks'

const updateList = [];


export function useUpdate(method, fn) {
	return useContext(context => {
		fn = bindContext(fn);
		const update = { context, method, fn };
		updateList.push(update);

		return function() {
			if (updateList.indexOf(update)!==-1) {
				updateList.splice(updateList.indexOf(update), 1);
			}
		}
	});
}


export function useReload(fn) {
	return useUpdate('reload', fn);
}


export function useReloadWithNode(fn) {
	return useUpdate('reloadWithNode', fn);
}


export function callUpdate(plugin, method, data) {
	updateList.filter(update => update.context===plugin.context && update.method===method).forEach(update => update.fn(data));
}
