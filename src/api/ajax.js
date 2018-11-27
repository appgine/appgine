
import { create } from '../lib/ajax'


const api = {
	initialState: {},
	ajax(state, endpoint, fn) {
		state.ajax = state.ajax || create();
		state.ajax.get(endpoint, fn);
	},
	ajaxPost(state, endpoint, data, fn) {
		state.ajax.post(endpoint, data, fn);
	},
	ajaxAbort(state) {
		if (state.ajax) {
			state.ajax.abort();
		}
	},
	destroy(state) {
		if (state.ajax) {
			state.ajax.abort();
			delete state.ajax;
		}
	}
}

export default api;
