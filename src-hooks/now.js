
import { requestStack } from '../lib/engine/run'


export default function now() {
	const request = requestStack.findRequest(this.$element);
	return request && request.created || Date.now();
}
