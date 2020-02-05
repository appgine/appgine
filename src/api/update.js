
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
		state.splice(0, state.length).forEach(methods => destroy(methods));
	},
}
