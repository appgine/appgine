
var _waiting = 0;
var _pending = 0;
var _onUpdated = [];


export function onUpdated(fn) {
	_onUpdated.push(fn);
	return function unsubscribe() {
		if (_onUpdated.indexOf(fn)!==-1) {
			_onUpdated.splice(_onUpdated.indexOf(fn), 1);
		}
	}
}


export function isUpdating() {
	return _pending>Date.now()-5000;
}


export function willUpdate(fn) {
	_pending = Date.now();
	_waiting++;
	return fn ? (fn(), wasUpdated()) : wasUpdated;
}


export function wasUpdated() {
	if (--_waiting<=0) {
		_waiting = 0;
		_pending = 0;
		_onUpdated.forEach(fn => fn());
	}
}
