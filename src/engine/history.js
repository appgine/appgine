
import Kefir from 'kefir'
import shallowEqual from '../lib/shallowEqual'
import closure from '../closure'

if (window.history && window.history.scrollRestoration) {
	window.history.scrollRestoration = 'manual';
}


const _session = closure.string.getRandomString();
const _supported = !!(window.history && window.history.pushState);
const _events = {};

let _canceling = false;
let _merging = false;
let _mergeEmitter = null;

let _id = 0;
let _firstlink = window.location.href;
let _state = window.history.state||{};
let _link = closure.uri.change(window.location.href);
let _origin = _state.origin || _link;

!_state._id && mergeState(_state = createState({}, true));


function createState(state={}, initial=false) {
	return {...state,
		_id: _session + _id,
		initial: initial,
	};
}

export function isSupported() {
	return _supported;
}

export function isInitial() {
	return state('initial', false);
}

export function getCanonizedLink(link) {
	return closure.uri.areSame(link, _origin) ? _link : link;
}

export function getLink() {
	return _link;
}

export function getLinks() {
	return [_link, _origin];
}

export function state(key, defval) {
	return key ? (_state[key]||defval) : {..._state};
}

export function popstate(fn) {
	const popstate = e => fn(e, window.location.href);

	_supported && window.addEventListener('popstate', popstate);
	return function() {
		_supported && window.removeEventListener('popstate', popstate);
	}
}

popstate((e, link) => {
	if (_canceling===false && link===_firstlink) {
		_firstlink = null;
		e.stopPropagation();
		e.stopImmediatePropagation();

	} else {
		_merging = false;
		_firstlink = null;
		_state = window.history.state||{};
		_link = closure.uri.change(link);
		_origin = _state.origin || _link;
		dispatch('change');

		if (_canceling) {
			_canceling = false;
			e.stopPropagation();
			e.stopImmediatePropagation();
		}
	}
})

export function onPush(fn) {
	return createEvent('push', fn);
}

export function onReplace(fn) {
	return createEvent('replace', fn);
}

export function onChange(fn) {
	fn(closure.uri.create());
	return createEvent('change', fn);
}

function createEvent(name, fn) {
	const items = _events[name] = _events[name] || [];
	items.push(fn);

	return function off() {
		if (items.indexOf(fn)!==-1) {
			items.splice(items.indexOf(fn), 1);
		}
	}
}

function dispatch(name) {
	(_events[name]||[]).forEach(fn => fn());
}

Kefir.stream(emitter => { _mergeEmitter = emitter; _merging && emitter.emit(_state); })
	.filter(value => isSupported())
	.map(value => ({..._state, ...value}))
	.filter(state => _merging = _merging || !shallowEqual(_state, state))
	.onValue(state => _state = state)
	.debounce(1000)
	.onValue(commitMergeState);

export function mergeState(state={}) {
	_mergeEmitter ? _mergeEmitter.emit(state) : (_merging = true);
}

function commitMergeState() {
	if (_merging) {
		_merging = false;

		if (_supported) {
			window.history.replaceState(_state, document.title, getLink());
		}
	}
}

export function cancelState() {
	_canceling = true;
	_supported ? window.history.back() : null;
}

export function replaceState(state={}, link) {
	closure.uri.isSame(link) && _link!==_origin && (state.origin = _origin);
	changeState(state, link, 'replaceState', 'replace');
}

export function pushState(state={}, link) {
	if (_canceling) {
		_canceling = false;
		replaceState(state, link);

	} else {
		commitMergeState();
		changeState(state, link, 'pushState', 'push');
	}
}

export function redirectState(state={}, link) {
	changeState({...state, origin: _origin}, link, 'replaceState', 'replace');
}

function changeState(state, link, method, invoke) {
	_firstlink = null;
	_merging = false;
	_state = createState(state);
	_link = closure.uri.change(link);
	_origin = _state.origin || _link;

	if (_supported) {
		window.history[method](_state, '', _link);

	} else {
		window.redirect(_link);
	}

	dispatch(invoke);
	dispatch('change');
}

export function changeId() {
	return mergeState({_id: _session + (++_id)});
}

export function getCurrentPos() {
	return _state._id||'';
}

export function getLength() {
	return _supported ? window.history.length : 1;
}

export function back() {
	_supported ? window.history.back() : null;
}

export function go(...args) {
	_firstlink = null;
	_supported ? window.history.go(...args) : null;
}
