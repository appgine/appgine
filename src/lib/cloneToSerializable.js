
import { isPlainObject } from 'plugin-macro-loader/lib/lib/lodash'


export default function cloneToSerializable(obj) {
	if (Array.isArray(obj)) {
		return obj.map(cloneToSerializable);

	} else if (isPlainObject(obj)) {
		const _obj = {};
		Object.keys(obj).forEach(key => _obj[key] = cloneToSerializable(obj[key]));
		return _obj;

	} else if (obj instanceof Element && obj.attributes) {
		const tag = [String(obj.tagName||'')];

		for (let attr of obj.attributes) {
			tag.push(attr.name + '="' + attr.value + '"');
		}

		return '<' + tag.join(' ') + '>';
	}

	return obj;
}
