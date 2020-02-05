
import { create, ABORT } from '../lib/ajax'
import createRequestnum from '../requestnum'
import * as channel from './channel'

const api = {
	initialState: {requestnum: 0, $element: null, isGlobal: false},
	globalAjax(state, endpoint, fn) {
		ajaxRequest(this.$element, state, 'get', true, false, endpoint, fn);
	},
	globalAjaxPost(state, endpoint, data, fn) {
		ajaxRequest(this.$element, state, 'post', true, false, endpoint, data, fn);
	},
	ajax(state, endpoint, fn) {
		ajaxRequest(this.$element, state, 'get', false, false, endpoint, fn);
	},
	ajaxPost(state, endpoint, data, fn) {
		ajaxRequest(this.$element, state, 'post', false, false, endpoint, data, fn);
	},
	pluginAjax(state, endpoint, fn) {
		ajaxRequest(this.$element, state, 'get', false, true, endpoint, fn);
	},
	pluginAjaxPost(state, endpoint, data, fn) {
		ajaxRequest(this.$element, state, 'post', false, true, endpoint, data, fn);
	},
	ajaxAbort: ajaxAbort,
	destroy(state) {
		if (state.ajax) {
			delete state.ajax;
			delete state.$element;

			if (state.isPlugin) {
				state.ajax.abort();
			}
		}
	}
}

function ajaxRequest($element, state, method, isGlobal, isPlugin, endpoint, ...args) {
	state.ajax = state.ajax || create();
	ajaxAbort(state);

	const requestnum = createRequestnum();
	state.requestnum = requestnum;
	state.$element = $element;
	state.isGlobal = isGlobal;
	state.isPlugin = isPlugin;

	channel.dispatch('ajax.request', 'start', endpoint, { $element, requestnum, isGlobal });

	const fn = args.pop();
	state.ajax[method](endpoint, ...args, function(status, response) {
		if (state.requestnum===requestnum) {
			state.requestnum = 0;
			state.$element = null;
		}

		channel.dispatch('ajax.request', status===ABORT ? 'abort' : 'end', { $element, requestnum, isGlobal });

		if (state.ajax) {
			fn(status, response);
		}
	});
}

function ajaxAbort(state) {
	if (state.ajax && state.requestnum && state.ajax.canAbort()) {
		const $element = state.$element;
		const requestnum = state.requestnum;
		const isGlobal = state.isGlobal;

		channel.dispatch('ajax.request', 'abort', { $element, requestnum, isGlobal });
		state.requestnum = 0;
		state.$element = null;
		state.ajax.abort();
	}
}

export default api;
