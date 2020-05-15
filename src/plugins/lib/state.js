
import { isEqual, isPlainObject } from './lodash'
import clone from './clone'

const properties = ['initial', 'reset', 'resetInitial', 'persist', 'isDirty', 'isDirtyInitial'];
const propertiesFactory = [createInitial, createReset, createResetInitial, createPersist, createIsDirty, createIsDirtyInitial];


export default function createState() {
	const pointers = [];
	const states = [];
	const state = function state() {
		let found;
		for (let pointer of pointers) {
			if (pointer.length!==arguments.length) {
				continue;

			} else if (pointer.filter((val, i) => val!==arguments[i]).length) {
				continue;
			}

			return states[pointers.indexOf(pointer)];
		}

		const substate = createState();

		substate.destroy = function() {
			if (states.indexOf(substate)!==-1) {
				pointers.splice(states.indexOf(substate), 1);
				states.splice(states.indexOf(substate), 1);
			}
		}

		pointers.push([...arguments]);
		states.push(substate);
		return substate;
	}

	for (let i=0; i<properties.length; i++) {
		if (Object.defineProperty) {
			Object.defineProperty(state, properties[i], {
				value: propertiesFactory[i](state),
				enumerable: false,
				writable: false,
			});

		} else {
			state[properties[i]] = propertiesFactory[i](state);
		}
	}

	state.__proto__ = Object.prototype;
	return state;
}


function createInitial(state) {
	const initial = function(initialState, zeroState) {
		initialState = initialState || {};
		zeroState = zeroState || {};

		checkState(initialState);
		checkState(zeroState);

		copyInto(initial.initialState, clone(initialState));
		copyInto(initial.zeroState, clone(zeroState));

		const newState = {
			...initial.zeroState,
			...initial.initialState,
			...initial.persistState,
		}

		extendObject(state, clone(newState), initial.source, initial.pointers, initial.sources);
	}

	initial.pointers = [];
	initial.sources = [];
	initial.source = {};
	initial.persistState = {};
	initial.initialState = {};
	initial.zeroState = {};

	return initial;
}


function createReset(state) {
	return function(zero=false) {
		if (zero===false && state.isDirtyInitial()) {
			state.resetInitial();

		} else if (state.isDirty()) {
			copyState(state, {
				...state.initial.zeroState,
				...state.initial.initialState,
				...state.initial.persistState,
				...state.initial.zeroState,
			});
		}
	}
}


function createResetInitial(state) {
	return function() {
		copyState(state, {
			...state.initial.zeroState,
			...state.initial.initialState,
			...state.initial.persistState,
		});
	}
}


function createPersist(state) {
	return function(persistState, copyToState=true) {
		if (persistState===undefined) {
			persistState = {};

			Object.keys(state.initial.initialState).forEach(function(key) {
				persistState[key] = state[key];
			});
		}

		checkState(persistState);

		state.initial.persistState = {
			...state.initial.persistState,
			...clone(persistState||{}),
		};

		if (copyToState) {
			copyState(state, persistState);
		}
	}
}


function createIsDirty(state) {
	return function() {
		return isDirty(state, [state.initial.zeroState, state.initial.persistState, state.initial.initialState]);
	}
}


function createIsDirtyInitial(state) {
	return function() {
		return isDirty(state, [state.initial.persistState, state.initial.initialState]);
	}
}


function checkState(state) {
	if (isPlainObject(state)===false) {
		throw new Error('Plugin state has to be plain Object.');
	}

	for (let key of properties) {
		if (key in state) {
			throw new Error("Plugin state does not support '" + key + "' key.");
		}
	}
}


function isDirty(state, states) {
	for (let key of Object.keys(state)) {
		states: {
			for (let _state of states) {
				if (_state[key]!==undefined) {
					if (isEqual(state[key], _state[key])===false) {
						return true;
					}

					break states;
				}
			}
		}
	}

	return false;
}


function copyInto(obj, state) {
	for (let key of Object.keys(state)) {
		obj[key] = state[key];
	}
}


function copyState(state, newState) {
	newState = clone(newState);

	Object.keys(newState).forEach(function(key) {
		delete state[key];
		extend(key, state, newState, state.initial.source, state.initial.pointers, state.initial.sources);
	});
}


function extendObject(state, initialState, source, pointers, sources) {
	Object.keys(initialState).forEach(function(key) {
		extend(key, state, initialState, source, pointers, sources);
	});

	Object.keys(state).forEach(function(key) {
		if (initialState[key]===undefined && isEqual(state[key], source[key])) {
			delete state[key];
			delete initialState[key];
		}
	});
}


function extendArray(state, initialState, source, pointers, sources) {
	for (let i=0; i<initialState.length; i++) {
		extend(i, state, initialState, source, pointers, sources);
	}

	if (state.length>initialState.length && state.length===source.length) {
		let equal = true;
		for (i; i<state.length; i++) {
			equal = equal && isEqual(state[i], source[i]);
		}

		if (equal) {
			state.splice(initialState.length);
			source.splice(initialState.length);
		}
	}
}


function extend(key, state, initialState, source, pointers, sources) {
	const value = initialState[key];
	const index = pointers.indexOf(state[key]);

	if (index!==-1) {
		if (isPlainObject(state[key]) && isPlainObject(value)) {
			extendObject(state[key], value, sources[index], pointers, sources);

		} else if (Array.isArray(state[key]) && Array.isArray(value)) {
			extendArray(state[key], value, sources[index], pointers, sources);

		} else {
			state[key] = undefined;
		}
	}

	if (state[key]===undefined) {
		if (isPlainObject(value)) {
			const _source = {};
			state[key] = {};
			pointers.push(state[key]);
			sources.push(_source);
			extendObject(state[key], value, _source, pointers, sources);

		} else if (Array.isArray(value)) {
			const _source = [];
			state[key] = [];
			pointers.push(state[key]);
			sources.push(_source);
			extendArray(state[key], value, _source, pointers, sources);

		} else {
			state[key] = value;
			source[key] = value;
		}

	} else if (state[key]===source[key]) {
		source[key] = value;
		state[key] = value;
	}
}
