
import { ajax, dom } from '../closure'
import createListeners from './createListeners'


const listeners = createListeners();

const api = {
	onPluginRequest(state=[], ...args) {
		state.push(listeners.create(api.onPluginRequest, this.$element, ...args));
		return state;
	},
	onPluginClick(state=[], ...args) {
		state.push(listeners.create(api.onPluginClick, this.$element, ...args));
		return state;
	},
	onPluginSubmit(state=[], ...args) {
		state.push(listeners.create(api.onPluginSubmit, this.$element, ...args));
		return state;
	},
	onRequest(state=[], ...args) {
		state.push(listeners.create(api.onRequest, this.$element, ...args));
		return state;
	},
	onClick(state=[], ...args) {
		state.push(listeners.create(api.onClick, this.$element, ...args));
		return state;
	},
	onSubmit(state=[], ...args) {
		state.push(listeners.create(api.onSubmit, this.$element, ...args));
		return state;
	},
	destroy(state) {
		state.forEach(listener => listener());
	}
}

export default api;

export function createClickRequest(e, $link, endpoint) {
	return createRequest(listeners.find(
		[[e, $link, endpoint], api.onPluginClick, onPluginCheck($link)],
		[[e, $link, endpoint], api.onClick],
		[[$link, endpoint, ''], api.onPluginRequest, onPluginCheck($link)],
		[[$link, endpoint, ''], api.onRequest]
	));
}

export function createSubmitRequest(e, $form, $submitter, endpoint, data) {
	return createRequest(listeners.find(
		[[e, $form, $submitter, endpoint, data], api.onPluginSubmit, onPluginCheck($form), onFormCheck($form, $submitter)],
		[[e, $form, $submitter, endpoint, data], api.onSubmit, onFormCheck($form, $submitter)],
		[[$form, endpoint, data], api.onPluginRequest, onPluginCheck($form)],
		[[$form, endpoint, data], api.onRequest]
	));
}

export function createHttpRequest($element, endpoint, data) {
	return createRequest(listeners.find(
		[[$element, endpoint, data], api.onPluginRequest, onPluginCheck($element)],
		[[$element, endpoint, data], api.onRequest]
	));
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
			if (result && result[method] && listeners.contains(listener)) {
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
