
import { destroy } from 'plugin-macro-loader/lib/lib/destroy'


export default {
	initialState: [],
	update(state, methods) {
		state.push(methods);
		return function() {
			if (state.indexOf(methods)!==-1) {
				state.splice(state.indexOf(methods), 1);
			}

			destroy(methods);
		}
	},
	destroy(state) {
		for (let methods of state) {
			destroy(methods);
		}
	},
}
