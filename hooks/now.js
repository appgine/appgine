
import { requestStack } from '../lib/engine/run'
import { getContext } from 'appgine/hooks'


export default function now() {
	const context = getContext();
	const request = requestStack.findRequest(context && context.$element);
	return request && request.created || Date.now();
}
