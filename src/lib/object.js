

export function fillKeys(keys, fill, isFunction) {
	const _fill = (isFunction && fill) || function() { return fill; };
	let values = {};

	if (keys.length===undefined) {
	  values = keys;
	  keys = Object.keys(keys);
	}

	const ret = {};
	keys.forEach(key => ret[key] = _fill(key, values[key]));
	return ret;
}


export function fromPair(key, val) {
	const ret = {};
	ret[key] = val;
	return ret;
}
