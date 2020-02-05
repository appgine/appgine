
let _updating = 0;
let _swapping = 0;
let _pending = 0;
let _onUpdated = [];


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


export function isSwapping() {
	return _swapping>0;
}


export function willSwap(fn) {
	willUpdate();
	_swapping++;
	fn();
	_swapping--;
	wasUpdated();
}


export function willUpdate(fn) {
	_pending = Date.now();
	_updating++;
	return fn ? (fn(), wasUpdated()) : wasUpdated;
}


export function wasUpdated() {
	if (--_updating<=0 && _swapping<=0) {
		_updating = 0;
		_pending = 0;
		_onUpdated.forEach(fn => fn());
	}
}
