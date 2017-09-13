
import createListeners from './createListeners'

const listeners = createListeners();


export default {
	initialState: {},
	findMethods(state, method) {
		const found = listeners.find([method]);
		return found.map(({ listener: { handler }}) => handler);
	},
	findElementMethods(state, method, $element) {
		const found = listeners.find(
			[method, _$element => $element && _$element && _$element.contains && _$element.contains($element)]
		);

		return found.map(({ listener: { handler }}) => handler);
	},
	addMethod(state, method, handler) {
		if (state[method]) {
			state[method]();
		}

		state[method] = listeners.create(method, this.$element, this, handler);
	},
	destroy(state) {
		for (let key of Object.keys(state)) {
			state[key]();
			delete state[key];
		}
	},
}
