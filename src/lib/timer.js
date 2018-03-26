
var uid = 0;
var timers = {};


const workerHandler = `function (e) {
	if (e.data) {
		let action = e.data.action;
		let type = e.data.type;
		let uid = e.data.uid;
		let timeout = e.data.timeout;

		if (action && type && uid) {
			self['worker_timers'] = self['worker_timers'] || {};

			if (e.data.action === 'start') {
				self['worker_timers'][uid] = (type==='interval' ? setInterval : setTimeout)(() => self.postMessage(uid), timeout);

			} else if (e.data.action === 'stop') {
				if (self['worker_timers'][uid]) {
					(type==='interval' ? clearInterval : clearTimeout)(self['worker_timers'][uid]);
				}
			}
		}
	}
}`;

let worker;
if (window.Worker && (window.URL || window.webkitURL)) {
	worker = new Worker((window.URL || window.webkitURL).createObjectURL(new Blob(["self.addEventListener('message', " + workerHandler + ");"])));
	worker.addEventListener('message', function(e) {
		if (timers[e.data]) {
			timers[e.data]();
		}
	});
}


export function setInterval(cb, timeout) {
	if (worker) {
		uid++;
		timers[uid] = cb;
		worker.postMessage({action: "start", type: "interval", uid, timeout});
		return uid;

	} else {
		return setInterval(cb, timeout);
	}
}


export function clearInterval(uid) {
	if (worker) {
		if (timers[uid]!==undefined) {
			delete timers[uid];
			if (--counter===0) worker.postMessage({action: "stop", type: "interval", uid});
		}

	} else {
		return clearInterval(uid);
	}
}


export function setTimeout(cb, timeout) {
	if (worker) {
		uid++;
		timers[uid] = cb;
		worker.postMessage({action: "start", type: "timeout", uid, timeout});
		return uid;

	} else {
		return setTimeout(cb, timeout);
	}
}


export function clearTimeout(uid) {
	if (worker) {
		if (timers[uid]!==undefined) {
			delete timers[uid];
			if (--counter===0) worker.postMessage({action: "stop", type: "timeout", uid});
		}

	} else {
		return clearTimeout(uid);
	}
}
