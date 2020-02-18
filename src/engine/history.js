
import shallowEqual from '../lib/shallowEqual'
import closure from '../closure'

const _supported = !!(window.history && window.history.pushState);

const _events = {};
const _popstateListeners = [];
let _canceling = false;
let _session = '';
let _id = 0;
let _firstlink = window.location.href;
let _initialLink = true;
let _state = window.history.state||{};
let _mergingState = null;
let _link = closure.uri.change(window.location.href);
let _origin = _state.origin || _link;

let _requestTree = [];

const matched = String(_state._id).match(/^(.*)_([0-9]+)_([0-9]+)$/);

if (matched) {
	_session = matched[1];
	_id = parseInt(matched[2], 10);

	try {
		if (window.sessionStorage) {
			mergeStateImmediatelly(JSON.parse(window.sessionStorage.getItem('appgine.history.state')||'{}')||{});
		}
	} catch (e) {}

} else {
	_session = closure.string.getRandomString();
	mergeStateImmediatelly(createState({}, null, true))
}

_requestTree[_state._position] = _state._id;

export function init(ajaxEnabled) {
	if (window.history && window.history.scrollRestoration) {
		if ((/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream)===false) {
			window.history.scrollRestoration = ajaxEnabled ? 'manual' : 'auto';
		}
	}

	const link = closure.uri.change(window.location.href);

	if (_link!==link) {
		changeState(_state, link);
	}
}

function createStateId(position) {
	return _session + '_' + String(++_id) + '_' + position;
}

function createState(state={}, increment=false, initial=false) {
	const _position = initial ? 0 : (_state._position + (increment ? 1 : 0));
	const _id = (_state && _state._id) || createStateId(_position);

	return {...state, _id, _position, initial }
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
	const popstate = e => fn(e, window.location.href, _initialLink);
	const dispose = function() {
		_supported && window.removeEventListener('popstate', popstate);

		if (_popstateListeners.indexOf(dispose)!==-1) {
			_popstateListeners.splice(_popstateListeners.indexOf(dispose), 1);
		}
	}

	_supported && window.addEventListener('popstate', popstate);

	return _popstateListeners.push(dispose);
}

popstate((e, link, initial) => {
	_initialLink = initial && _canceling===false && link===_firstlink;
	_mergingState = null;
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

export function mergeState(value={})
{
	const state = {..._state, ...value};

	if (!shallowEqual(_state, state)) {
		_state = state;
		_mergingState = {..._mergingState, ...value}

		if (Object.keys(_mergingState).length===1 && _mergingState.scrollTop===undefined) {
			commitMergeState();

		} else if (Object.keys(_mergingState).length>1) {
			commitMergeState();

		} else if (window.sessionStorage) {
			try {
				window.sessionStorage.setItem('appgine.history.state', JSON.stringify(_mergingState));
			} catch (e) {}
		}
	}
}

function mergeStateImmediatelly(value, pushState=false, invoke=null)
{
	_state = {..._state, ...value};
	commitMergeState(pushState, invoke);
}

function commitMergeState(pushState=false, invoke=null) {
	if (_supported) {
		const method = pushState ? 'pushState' : 'replaceState';
		window.history[method](_state, document.title, closure.uri.createCanonical(getLink(), true));
	}

	if (invoke) {
		dispatch(invoke);
		dispatch('change');
	}

	_mergingState = null

	if (window.sessionStorage) {
		window.sessionStorage.removeItem('appgine.history.state');
	}
}

export function cancelState() {
	_canceling = true;
	_supported ? window.history.back() : null;
}

export function canonical(link, deferred) {
	if (_link!==closure.uri.create(link, true, true)) {
		if (closure.uri.sameOrigin(link)) {
			if (deferred) {
				_link = closure.uri.change(link);

			} else {
				changeState(_state, link, false, 'replace');
			}
		}
	}
}

export function replaceState(state={}, link) {
	closure.uri.isSame(link) && _link!==_origin && (state.origin = _origin);
	changeState(createState(state, false), link, false, 'replace');
}

export function pushState(state={}, link) {
	if (_canceling) {
		_canceling = false;
		replaceState(state, link);

	} else {
		changeState(createState(state, true), link, true, 'push');
		_requestTree.splice(_state._position, _requestTree.length, _state._id);
	}
}

export function redirectState(state={}, link) {
	changeState(createState({...state, origin: _origin}, false), link, false, 'replace');
}

function changeState(state, link, pushState, invoke) {
	if (pushState && _mergingState) {
		commitMergeState();
	}

	_firstlink = null;
	_state = state;
	_link = closure.uri.change(link);
	_origin = _state.origin || _link;

	if (_supported) {
		mergeStateImmediatelly({}, pushState, invoke);

	} else {
		window.redirect(_link);
	}
}

export function changeId() {
	const _id = createStateId(_state._position);
	_requestTree[_state._position] = _id;
	return mergeStateImmediatelly({ _id });
}

export function getCurrentId() {
	return _state._id||'';
}

export function getCurrentTree() {
	return _requestTree.slice(0, _state._position+1);
}

export function getLength() {
	return _supported ? window.history.length : 1;
}

export function back(back=-1) {
	if (typeof back==='string') {
		if (_requestTree.indexOf(back)!==-1) {
			back = _requestTree.lastIndexOf(back, _state._position) - _state._position;
		}

	} else if (typeof back==='number') {
		back = back - _state._position;
	}

	_supported ? window.history.go(back) : null;
}

export function go(...args) {
	_firstlink = null;
	_supported ? window.history.go(...args) : null;
}

export function dispose() {
	_popstateListeners.filter(_ => true).forEach(popstate => popstate());
}
