
import { onRedirect } from '../engine/run'


const api = {
	redirect(state, endpoint) {
		return onRedirect(this.$element, endpoint);
	}
}

export default api;
