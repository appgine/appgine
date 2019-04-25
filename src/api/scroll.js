
import { scroll } from '../engine/run'


const api = {
	scroll(state, $element, animated) {
		return scroll(this.$element || $element, animated);
	}
}

export default api;
