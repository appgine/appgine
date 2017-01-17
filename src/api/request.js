
import { ajax, dom } from '../closure'


const listeners = [];

const api = {
	onPluginRequest(state=[], ...args) {
		state.push(createListener(api.onPluginRequest, this.$element, ...args));
		return state;
	},
	onPluginClick(state=[], ...args) {
		state.push(createListener(api.onPluginClick, this.$element, ...args));
		return state;
	},
	onPluginSubmit(state=[], ...args) {
		state.push(createListener(api.onPluginSubmit, this.$element, ...args));
		return state;
	},
	onRequest(state=[], ...args) {
		state.push(createListener(api.onRequest, this.$element, ...args));
		return state;
	},
	onClick(state=[], ...args) {
		state.push(createListener(api.onClick, this.$element, ...args));
		return state;
	},
	onSubmit(state=[], ...args) {
		state.push(createListener(api.onSubmit, this.$element, ...args));
		return state;
	},
	destroy(state) {
		state.forEach(listener => listener());
	}
}

export default api;

export function createClickRequest(e, $link, endpoint) {
	return createRequest(findListeners(
		[api.onPluginClick, [e, $link, endpoint], onPluginCheck($link)],
		[api.onClick, [e, $link, endpoint]],
		[api.onPluginRequest, [$link, endpoint, ''], onPluginCheck($link)],
		[api.onRequest, [$link, endpoint, '']]
	));
}

export function createSubmitRequest(e, $form, $submitter, endpoint, data) {
	return createRequest(findListeners(
		[api.onPluginSubmit, [e, $form, $submitter, endpoint, data], onPluginCheck($form), onFormCheck($form, $submitter)],
		[api.onSubmit, [e, $form, $submitter, endpoint, data], onFormCheck($form, $submitter)],
		[api.onPluginRequest, [$form, endpoint, data], onPluginCheck($form)],
		[api.onRequest, [$form, endpoint, data]]
	));
}

export function createHttpRequest($element, endpoint, data) {
	return createRequest(findListeners(
		[api.onPluginRequest, [$element, endpoint, data], onPluginCheck($element)],
		[api.onRequest, [$element, endpoint, data]]
	));
}


function createListener(type, $element, ...args) {
	const handler = args.pop();
	const listener = { type, $element, args, handler };
	listeners.push(listener);

	return function() {
		if (listeners.indexOf(listener)!==-1) {
			listeners.splice(listeners.indexOf(listener), 1)
		}
	}
}


function findListeners(...args) {
	const _listeners = [];

	for (let listener of listeners) {
		listener: {
			for (let [type, typeArgs, ...filters] of args) {
				if (listener.type!==type) {
					continue;

				} else if (listener.$element && document.contains(listener.$element)===false) {
					continue;

				} else {
					for (let filter of filters) {
						if (!filter(listener.$element, listener.args)) {
							break listener;
						}
					}

					_listeners.push({ type, typeArgs, listener});
					break listener;
				}
			}
		}
	}

	return _listeners;
}


function onPluginCheck($requestElement) {
	return function($element, args) {
		if ($requestElement && $element) {
			return dom.contains($element, $requestElement);
		}

		return false;
	}
}


function onFormCheck($form, $submitter) {
	return function($element, args) {
		const formName = String($form && $form.getAttribute('name'))||'';
		const submitName = String($submitter && $submitter.getAttribute('name'))||'';

		const names = [
			formName,
			formName + ':' + submitName,
			formName + '[' + submitName + ']',
			':' + submitName,
		];

		if (typeof args[0]==='string' && args[0]!=='*' && names.indexOf(args[0])===-1) {
			return false;

		} else if (typeof args[1]==='string' && args[1]!==submitName) {
			return false;
		}

		return true;
	}
}


function createRequest(_listeners) {
	for (let listenerObj of _listeners) {
		const { listener, typeArgs } = listenerObj;

		try {
			listenerObj.result = listener.handler(...typeArgs);

		} catch(e) {
			console.error(e);
		}
	}

	const callListeners = function(method, ...args) {
		for (let { result, listener } of _listeners) {
			if (result && result[method] && listeners.indexOf(listener)!==-1) {
				try {
					result[method](...args);

				} catch(e) {
					console.error(e);
				}
			}
		}
	}

	return {
		prevented() { callListeners('prevented'); },
		onResponse(status, response) { callListeners('onResponse', status, response); },
		onResponseLeave(endpoint) { callListeners('onResponseLeave', endpoint); },
		onResponseCanonize(endpoint) { callListeners('onResponseCanonize', endpoint); },
		onResponseRedirect(endpoint) { callListeners('onResponseRedirect', endpoint); },
		onResponseUpdate() { callListeners('onResponseUpdate'); },
		onResponseSwap(request) { callListeners('onResponseSwap', request); },
		end(status, response, isLast) {
			switch (status) {
				case ajax.ABORT: callListeners('onAbort', response, isLast); break;
				case ajax.TIMEOUT: callListeners('onTimeout', response, isLast); break;
				case ajax.ERROR: callListeners('onError', response, isLast); break;
				case ajax.SUCCESS: callListeners('onSuccess', response, isLast); break;
			}

			callListeners('onComplete', status, response, isLast);
		},
	}
}
