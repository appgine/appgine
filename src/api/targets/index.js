
import TargetList from './TargetList'


export default {
	initialState: [],
	createTargets(state=[], ...args) {
		const fn = args.pop() || function() {};
		const api = new TargetList(...args);
		state.push(api);
		fn(api);
		return api;
	}
}
