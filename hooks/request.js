
import { dom } from 'appgine/closure'
import * as ajax from '../src/lib/ajax'
import createListeners from '../src/lib/createListeners'

import { useContext } from 'appgine/hooks'

const listeners = createListeners();

export const usePluginRequest = bindListener(usePluginRequest);
export const usePluginClick = bindListener(usePluginClick);
export const usePluginSubmit = bindListener(usePluginSubmit);
export const useRequest = bindListener(useRequest);
export const useClick = bindListener(useClick);
export const useSubmit = bindListener(useSubmit);

function bindListener(method) {
	return function(...args) {
		const fn = bindContext(args.pop());
		return useContext(context => listeners.create(method, context.$element, ...args, fn));
	}
}


export function createClickRequest(e, $link, endpoint) {
	return createRequest(listeners.find(
		[[e, $link, endpoint], usePluginClick, onPluginCheck($link)],
		[[e, $link, endpoint], useClick, onElementCheck],
		[[$link, endpoint, ''], usePluginRequest, onPluginCheck($link)],
		[[$link, endpoint, ''], useRequest, onElementCheck]
	));
}

export function createSubmitRequest(e, $form, $submitter, endpoint, data) {
	return createRequest(listeners.find(
		[[e, $form, $submitter, endpoint, data], usePluginSubmit, onPluginCheck($form), onFormCheck($form, $submitter)],
		[[e, $form, $submitter, endpoint, data], useSubmit, onElementCheck, onFormCheck($form, $submitter)],
		[[$form, endpoint, data], usePluginRequest, onPluginCheck($form)],
		[[$form, endpoint, data], useRequest, onElementCheck]
	));
}

export function createHttpRequest($element, endpoint, data) {
	return createRequest(listeners.find(
		[[$element, endpoint, data], usePluginRequest, onPluginCheck($element)],
		[[$element, endpoint, data], useRequest, onElementCheck]
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


function onElementCheck($element) {
	return !$element || document.contains($element);
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
		let ret = false;
		for (let { result, listener } of _listeners) {
			if (result && result[method] && listeners.contains(listener)) {
				try {
					if (result[method](...args)) {
						ret = true;
					}

				} catch(e) {
					console.error(e);
				}
			}
		}

		return ret;
	}

	return {
		prevented() { callListeners('prevented'); },
		onResponse(status, response, isLast) {
			callListeners('onResponse', status, response, isLast);

			switch (status) {
				case ajax.ABORT: callListeners('onAbort', response, isLast); break;
				case ajax.TIMEOUT: callListeners('onTimeout', response, isLast); break;
				case ajax.ERROR: callListeners('onError', response, isLast); break;
				case ajax.SUCCESS: callListeners('onSuccess', response, isLast); break;
			}
		},
		onResponseLeave(endpoint) { return callListeners('onResponseLeave', endpoint); },
		onResponseCanonize(endpoint) { return callListeners('onResponseCanonize', endpoint); },
		onResponseRedirect(endpoint) { return callListeners('onResponseRedirect', endpoint); },
		onResponseUpdate() { return callListeners('onResponseUpdate'); },
		onResponseSwap(request) { return callListeners('onResponseSwap', request); },
		onComplete(isLast) { callListeners('onComplete', isLast); },
	}
}
