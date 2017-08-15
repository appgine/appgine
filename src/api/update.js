

export default {
	initialState: [],
	update(state, methods) {
		state.push(methods);
	},
	destroy(state) {
		for (let _state of state) {
			if (_state.destroy) {
				_state.destroy();
			}
		}
	},
}
