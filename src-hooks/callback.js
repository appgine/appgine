
import { bindContext } from 'appgine/hooks'


export function bindCallback(fn) {
	return bindContext(fn);
}


export function bindApi(api) {
	const _api = {}
	Object.keys(api).forEach(key => _api[key] = bindContext(api[key].bind(api)));
	return _api;
}
