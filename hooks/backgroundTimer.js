
import { useContext, bindContext, bindContextWithDestroy } from 'appgine/hooks'


export function useTimeout(fn, timeout) {
	return useContext(function() {
		const pointer = setBackgroundTimeout(fn, timeout)
		return () => clearBackgroundTimeout(pointer);
	});
}


export function bindTimeout() {
	return bindContextWithDestroy(useTimeout);
}


export function useInterval(fn, internal) {
	return useContext(function() {
		const pointer = setBackgroundInterval(fn, internal)
		return () => clearBackgroundInterval(pointer);
	});
}


export function bindInterval(...args) {
	let pointer = null;
	return (args.length<=1 ? bindContextWithDestroy : bindContext)(function(...argsInternal) {
		return useContext(function() {
			pointer = pointer || setBackgroundInterval(...args, ...argsInternal);
			return function() {
				clearBackgroundInterval(pointer);
				pointer = null;
			}
		});
	});
}


const workerHandler = `self.addEventListener('message', function (e) {
	if (e.data) {
		var action = e.data.action;
		var type = e.data.type;
		var uid = e.data.uid;
		var timeout = e.data.timeout;

		if (action && type && uid) {
			self['worker_timers'] = self['worker_timers'] || {};

			if (e.data.action === 'start') {
				self['worker_timers'][uid] = (type==='interval' ? setInterval : setTimeout)(function() { self.postMessage(uid) }, timeout);

			} else if (e.data.action === 'stop') {
				if (self['worker_timers'][uid]) {
					(type==='interval' ? clearInterval : clearTimeout)(self['worker_timers'][uid]);
				}
			}
		}
	}
});`;

let worker;
let uid = 0;
const timers = {};

function getWorker() {
	if (worker===undefined) {
		worker = null;

		try {
			if (window.Worker && (window.URL || window.webkitURL)) {
				worker = new window.Worker((window.URL || window.webkitURL).createObjectURL(new Blob([workerHandler])));
				worker.addEventListener('message', function(e) {
					if (timers[e.data]) {
						timers[e.data]();
					}
				});
			}
		} catch(e) {}
	}

	return worker;
}


export function setBackgroundInterval(cb, timeout) {
	if (getWorker()) {
		uid++;
		timers[uid] = cb;
		getWorker().postMessage({action: "start", type: "interval", uid, timeout});
		return uid;

	} else {
		return global && global.setInterval(cb, timeout);
	}
}


export function clearBackgroundInterval(uid) {
	if (getWorker()) {
		if (timers[uid]!==undefined) {
			delete timers[uid];
			getWorker().postMessage({action: "stop", type: "interval", uid});
		}

	} else {
		return global && global.clearInterval(uid);
	}
}


export function setBackgroundTimeout(cb, timeout) {
	if (getWorker()) {
		uid++;
		timers[uid] = cb;
		getWorker().postMessage({action: "start", type: "timeout", uid, timeout});
		return uid;

	} else {
		return global && global.setTimeout(cb, timeout);
	}
}


export function clearBackgroundTimeout(uid) {
	if (getWorker()) {
		if (timers[uid]!==undefined) {
			delete timers[uid];
			getWorker().postMessage({action: "stop", type: "timeout", uid});
		}

	} else {
		return global && global.clearTimeout(uid);
	}
}
