
import { requestStack } from '../engine/run'


const api = {
	initialState: true,
	now(state) {
		const request = requestStack.findRequest(this.$element);
		return request && request.created || Date.now();
	}
}

export default api;
