
import * as tick from '../tick'


const api = {
	initialState: [],
	onTick(state, fn) {
		state.push(tick.onTick(this.$element, fn));
	},
	onImmediateTick(state, fn) {
		state.push(tick.onImmediateTick(this.$element, fn));
	},
	onceTick(state, fn) {
		state.push(tick.onceTick(this.$element, fn));
	},
	onEachTick(state, fn) {
		state.push(tick.onEachTick(this.$element, fn));
	},
	destroy(state) {
		state.forEach(tick => tick());
	}
}

export default api;
