
import TargetList from './TargetList'


export default {
	initialState: [],
	createTargets(state=[], ...args) {
		const fn = args.pop() || function() {};
		const api = new TargetList(this, ...args);
		state.push(api);
		fn(api);
		return api;
	},
	destroy(state) {
		state.forEach(targets => targets.destroy());
		state.splice(0, state.length);
	},
}
