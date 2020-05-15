
import { isPlainObject } from './lodash'


export default function clone(obj) {
	if (Array.isArray(obj)) {
		return obj.map(clone);

	} else if (isPlainObject(obj)) {
		const _obj = {};
		Object.keys(obj).forEach(key => _obj[key] = clone(obj[key]));
		return _obj;
	}

	return obj;
}
