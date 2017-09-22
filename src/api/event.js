

export default {
	initialState: [],
	event(state, obj, ...args) {
		state.unshift(addObjEvent(obj, ...args));
	},
	eventOnce(state, obj, name, fn, ...args) {
		let fired = false;
		state.unshift(addObjEvent(obj, name, function() {
			if (fired===false) {
				fired = true;
				fn && fn.apply(this, arguments);
			}
		}, ...args));
	},
	destroy(state) {
		state.forEach(fn => fn && fn());
		state.splice(0, state.length);
	}
}


function addObjEvent(obj, ...args) {
	if (obj.addEventListener) {
		obj.addEventListener(...args);
		return obj.removeEventListener && obj.removeEventListener.bind(obj, ...args);

	} else if (obj.on) {
		obj.on(...args);
		return obj.off && obj.off.bind(obj, ...args);
	}

	throw new Error('Unsupported event bind on given object');
}
