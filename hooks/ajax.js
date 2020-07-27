
import { create, ABORT } from '../lib/lib/ajax'
import createRequestnum from '../lib/requestnum'

import { useContext, bindContext } from 'appgine/hooks'
import { dispatch } from 'appgine/hooks/channel'


export const bindGlobalAjax = () => createInternalAjax('get', true, false);
export const bindAjax = () => createInternalAjax('get', false, false);
export const bindPluginAjax = () => createInternalAjax('get', false, true);
export const bindGlobalAjaxPost = () => createInternalAjax('post', true, false);
export const bindAjaxPost = () => createInternalAjax('post', false, false);
export const bindPluginAjaxPost = () => createInternalAjax('post', false, true);


function createInternalAjax(method, isGlobal, isPlugin) {
	const state = {}
	return bindContext((...args) => {
		return useContext(context => {
			const fn = bindContext(args.pop());
			return ajaxRequest(context.$element, state, method, isGlobal, isPlugin, ...args, fn);
		})
	});
}


function ajaxRequest($element, state, method, isGlobal, isPlugin, endpoint, ...args) {
	state.ajax = state.ajax || create();
	ajaxAbort(state);

	const requestnum = createRequestnum();
	state.requestnum = requestnum;
	state.$element = $element;
	state.isGlobal = isGlobal;
	state.isPlugin = isPlugin;

	dispatch('ajax.request', 'start', endpoint, { $element, requestnum, isGlobal });

	const fn = args.pop();
	state.ajax[method](endpoint, ...args, function(status, response) {
		if (state.requestnum===requestnum) {
			state.requestnum = 0;
			state.$element = null;
		}

		dispatch('ajax.request', status===ABORT ? 'abort' : 'end', { $element, requestnum, isGlobal });

		if (state.ajax) {
			fn(status, response);
		}
	});

	return function() {
		if (state.ajax) {
			if (state.isPlugin) {
				state.ajax.abort();
			}

			delete state.ajax;
			delete state.$element;
		}
	}
}

function ajaxAbort(state) {
	if (state.ajax && state.requestnum && state.ajax.canAbort()) {
		const $element = state.$element;
		const requestnum = state.requestnum;
		const isGlobal = state.isGlobal;

		dispatch('ajax.request', 'abort', { $element, requestnum, isGlobal });
		state.requestnum = 0;
		state.$element = null;
		state.ajax.abort();
	}
}
