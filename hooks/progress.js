
import * as uri from 'appgine/src/engine/uri'
import { isSwapping } from '../src/update'
import { getElementTarget } from '../src/lib/target'

import { withModuleContext, useContext, bindContext } from 'appgine/hooks'
import { useListen } from 'appgine/hooks/channel'
import { useEvent } from 'appgine/hooks/event'
import { getAncestor } from 'appgine/utils/dom'


export const useProgress = (...args) => internalUseProgress({ request: false }, ...args);
export const useAppProgress = (...args) => internalUseProgress({ ajax: false, request: false }, ...args);
export const useAjaxProgress = (...args) => internalUseProgress({ ajax: true, request: false }, ...args);
export const useFormProgress = (...args) => internalUseProgress({ form: true, request: false }, ...args);
export const useRequest = (...args) => internalUseProgress({ request: true }, ...args);
export const useAppRequest = (...args) => internalUseProgress({ ajax: false, request: true }, ...args);
export const useAjaxRequest = (...args) => internalUseProgress({ ajax: true, request: true }, ...args);
export const useFormRequest = (...args) => internalUseProgress({ form: true, ajax: false, request: true }, ...args);


function internalUseProgress(defaultAccept, accept, api) {
	const paramApi = api || accept;
	const paramAccept = (api && typeof accept==='function') ? { accept } : (accept instanceof HTMLElement ? { $element: accept } : (api && accept || {}));
	return useContext(() => createListener({ ...paramAccept, ...defaultAccept }, paramApi));
}


const $link = document.createElement('a');

const appRequestList = {};
const listeners = [];

let callingCreateStack = [];
let swapListeners = [];
const autoSubmitForm = [];
const autoSubmitElement = [];

withModuleContext(module, function() {
	useEvent(document, 'focusin', onFocusIn);
	useEvent(document, 'focusout', onFocusOut);

	useListen('auto-submit', 'start', onAutoSubmitStart);
	useListen('auto-submit', 'submit', onAutoSubmit);
	useListen('auto-submit', 'abort', $form => onAutoSubmitAbort($form));
	useListen('auto-submit', 'destroy', $form => onAutoSubmitDestroy($form));

	useListen('app.request', 'start', (endpoint, { $element, requestnum, abort }) => onRequestStart(requestnum, endpoint, $element, false, true, abort));
	useListen('app.request', 'submit', ({ requestnum, endpoint, method, data }) => onRequestSubmit(requestnum, { endpoint, method, data }));
	useListen('app.request', 'response', ({ requestnum, response }) => onRequestResponse(requestnum, response));
	useListen('app.request', 'upload', ({ requestnum, loaded, total }) => onRequestActionInternal(requestnum, 'progress', false, loaded, total));
	useListen('app.request', 'error', ({ requestnum, errno, error }) => onRequestActionEnd(requestnum, 'error', errno, error));
	useListen('app.request', 'abort', ({ requestnum }) => onRequestActionEnd(requestnum, 'abort'));
	useListen('app.request', 'end', ({ requestnum }) => onRequestActionEnd(requestnum, 'end'));

	useListen('ajax.request', 'start', (endpoint, { $element, requestnum, isGlobal, abort }) => onRequestStart(requestnum, endpoint, $element, true, isGlobal, abort));
	useListen('ajax.request', 'submit', ({ requestnum, endpoint, method, data }) => onRequestSubmit(requestnum, { endpoint, method, data }));
	useListen('ajax.request', 'response', ({ requestnum, response }) => onRequestResponse(requestnum, response));
	useListen('ajax.request', 'upload', ({ requestnum, loaded, total }) => onRequestActionInternal(requestnum, 'progress', false, loaded, total));
	useListen('ajax.request', 'abort', ({ requestnum }) => onRequestActionEnd(requestnum, 'abort'));
	useListen('ajax.request', 'end', ({ requestnum }) => onRequestActionEnd(requestnum, 'end'));
});


export function createListener(...acceptObjList)
{
	const createApi = acceptObjList.pop();

	const listener = function() {
		if (listeners.indexOf(listener)!==-1) {
			listeners.splice(listeners.indexOf(listener), 1);
		}

		tryRequestActionCall(null, listener.autoSubmitRequest, 'abort', true);
		tryRequestActionCall(null, listener.appRequest, null, true);

		for (let requestnum of Object.keys(listener.ajaxRequestList)) {
			tryRequestActionCall(null, listener.ajaxRequestList[requestnum], null, true)
		}
	}

	if (!createApi) {
		return listener;
	}

	listeners.push(listener);

	let currentListenerApi = null;
	const tmpCreateApi = bindContext(function(isAutoSubmit, request) {
		try {
			currentListenerApi = listener.form ? createApi(isAutoSubmit, request) : createApi(request);
		} catch (e) {}
		return currentListenerApi && currentListenerApi.dispose;
	});

	listener.createApi = (requestnum, isAutoSubmit, request) => {
		tmpCreateApi(isAutoSubmit, request);
		return currentListenerApi===false ? null : { request, requestnum, api: currentListenerApi||{} };
	};

	listener.endpointList = [];
	listener.labels = [];
	listener.ajax = null;
	listener.form = false;
	listener.formName = null;
	listener.autoSubmit = false;
	listener.request = false;

	listener.appRequest = null;
	listener.autoSubmitRequest = null;
	listener.ajaxRequestList = {};

	for (let acceptObj of acceptObjList) {
		if (acceptObj.ajax!==undefined) {
			listener.ajax = acceptObj.ajax;
		}

		listener.request = acceptObj.request || listener.request;
		listener.autoSubmit = acceptObj.autoSubmit || listener.autoSubmit;

		if (typeof acceptObj.accept === 'function') {
			listener.accept = acceptObj.accept;
		}

		if (acceptObj.$element) {
			if (acceptObj.form) {
				const $form = getAncestor(acceptObj.$element, 'form');
				const formName = $form && ($form.getAttribute('data-ajax') || $form.getAttribute('name')) || null;
				listener.formName = formName;
				listener.form = true;
				listener.$form = $form;
			}

			if (listener.formName===null) {
				listener.$element = acceptObj.$element;
				listener.contains = function($element) {
					const $contains = listener.$form||listener.$element;
					return $element && ($contains.contains($element) || $element.contains($contains)) || false;
				}
			}

		} else if (acceptObj.form) {
			listener.form = true;
		}

		if (acceptObj.labels) {
			listener.labels = Array.isArray(acceptObj.labels) ? acceptObj.labels : [acceptObj.labels];

		} else if (acceptObj.label) {
			listener.labels.push(acceptObj.label);
		}

		if (acceptObj.endpoint) {
			listener.endpointList = Array.isArray(acceptObj.endpoint) ? acceptObj.endpoint : [acceptObj.endpoint];
			listener.endpointList = listener.endpointList.map(endpoint => {
				$link.href = endpoint;
				$link.href = $link.href;
				return $link.href;
			});
		}
	}

	for (let requestnum of Object.keys(appRequestList)) {
		requestnum = parseInt(requestnum, 10);
		const request = appRequestList[requestnum]

		const foundListeners = matchListeners([listener], request.$element, request, true);

		if (foundListeners.length>0) {
			listener.labels.forEach(label => request.labels[label] = true);

			if (request.isAjax) {
				const ajaxRequest = listener.createApi(requestnum, false, {...request});
				ajaxRequest && (listener.ajaxRequestList[requestnum] = ajaxRequest);
				createApiFinish();

			} else {
				listener.appRequest = listener.createApi(requestnum, false, {...request});
				createApiFinish();
			}

			for (let [action, dispose, ...args] of request.actions) {
				tryRequestActionCall(requestnum, listener.appRequest, action, dispose, ...args);
				tryRequestActionCall(requestnum, listener.ajaxRequestList[requestnum], action, dispose, ...args);
			}
		}
	}

	return listener;
}


function matchListeners(listeners, $element, request=null, matchLabels=false)
{
	let selector;
	let endpoint;

	if (request && request.endpoint) {
		$link.href = request.endpoint;
		$link.href = $link.href;

		endpoint = $link.href;
		selector = 'a[href="'+endpoint.replace(/["\\]/g, '\\$&')+'"]';
	}

	let foundRequest = [];
	let foundProgress = [];
	let foundLevel = request && request.level || 0;
	for (let listener of listeners) {
		let matched = true;

		if (listener.ajax && request && request.isAjax===false) {
			continue;
		}

		if (listener.ajax===false && request && request.isAjax) {
			continue;
		}

		if (matchLabels) {
			matched = listener.labels.length===0 || listener.labels.some(label => request.labels[label]);
		}

		if (listener.accept) {
			if (!matched || !request) {
				continue;

			} else if (!listener.accept({...request})) {
				continue;
			}
		}

		if (endpoint && listener.endpointList.indexOf(endpoint)!==-1) {
			matched = true;

		} else if (selector && listener.$element && listener.$element.querySelector(selector)) {
			matched = true;

		} else if (listener.contains) {
			matched = matched && listener.contains($element);

		} else if (request && request.isGlobal) {
			matched = matched || listener.endpointList.length===0;
		}

		if (request && listener.formName) {
			matched = matched && listener.formName===request.formName;

		// } else if (listener.form && request && !request.formName) {
		// 	matched = false;
		}

		if (matched) {
			if (listener.request) {
				foundRequest.push(listener);

			} else if (listener.$element) {
				let elementLevel = 0;
				let $tmp = listener.$element;
				do { ++elementLevel } while (($tmp = $tmp.parentNode) && $tmp.tagName!=='BODY');

				if (foundLevel===elementLevel) {
					foundProgress.push(listener);

				} else if (foundLevel===0 || elementLevel>foundLevel) {
					foundLevel = elementLevel;
					foundProgress = [listener];
				}

			} else if (listener.$form) {
				let elementLevel = 0;
				let $tmp = listener.$form;
				do { ++elementLevel } while (($tmp = $tmp.parentNode) && $tmp.tagName!=='BODY');

				if (foundLevel < elementLevel) {
					foundLevel = elementLevel;
					foundProgress = [];
				}

				foundProgress.push(listener);

			} else if (foundLevel===0) {
				foundProgress.push(listener);
			}
		}
	}

	if (request) {
		request.level = foundLevel;
	}

	return [].concat(foundRequest, foundProgress);
}


function findListeners($element) {
	return matchListeners(listeners, $element);
}


function createApiFinish() {
	for (let [fn, ...args] of callingCreateStack.splice(0, callingCreateStack.length)) {
		fn(...args);
	}
}


function onFocusIn(e)
{
	for (let foundListener of findListeners(e.target)) {
		for (let swapListener of swapListeners) {
			if (foundListener.form===false || foundListener.form!==swapListener.form) {
				continue;

			} else if (foundListener.formName===null || foundListener.formName!==swapListener.formName) {
				continue;

			} else if (foundListener.autoSubmitRequest || foundListener.appRequest || Object.keys(foundListener.ajaxRequestList).length>0) {
				continue;
			}

			let swapRequest = null;
			for (let requestnum of Object.keys(swapListener.ajaxRequestList)) {
				const ajaxRequest = swapListener.ajaxRequestList[requestnum];

				if (ajaxRequest.request.formName===foundListener.formName) {
					swapRequest = {...ajaxRequest.request};
					break;
				}
			}

			if (swapListener.appRequest && swapListener.appRequest.request.formName===foundListener.formName) {
				swapRequest = {...swapListener.appRequest.request};
			}

			if (swapRequest===null) {
				continue;
			}

			swapRequest.$element = e.target;
			swapRequest.endpoint = uri.createForm(foundListener.$form, e.target);

			const autoSubmitRequest = foundListener.createApi(null, true, {...swapRequest});
			foundListener.autoSubmitRequest = autoSubmitRequest;
			createApiFinish();

			if (foundListener.autoSubmitRequest) {
				foundListener.autoSubmitRequest.abortTimeout = setTimeout(function() {
					foundListener.autoSubmitRequest = null;

					if (autoSubmitRequest.api.abort) {
						autoSubmitRequest.api.abort();
					}
				}, 300);
				break;
			}
		}
	}

	swapListeners = [];
}


function onFocusOut(e)
{
	if (isSwapping()) {
		swapListeners = findListeners(e.target);
		setTimeout(() => { swapListeners = []; }, 200);
	}
}


function onAutoSubmitStart($form, $element, abort)
{
	if (autoSubmitForm.indexOf($form)===-1) {
		autoSubmitForm.push($form);
	}

	autoSubmitElement[autoSubmitForm.indexOf($form)] = $element;

	const formTarget = getElementTarget($element) || getElementTarget($form)
	const formName = $form.getAttribute('data-ajax') || $form.getAttribute('name') || null;

	const isAjax = formTarget==='_ajax';
	const isGlobal = false;
	const endpoint = uri.createForm($form, $element);
	const request = { isAjax, isGlobal, endpoint, $form, $element, formName, labels: {}, level: 0, actions: [], abort  };

	for (let listener of matchListeners(listeners, $element, request, false)) {
		if (listener.autoSubmitRequest) {
			listener.autoSubmitRequest.requestnum = null;
			listener.autoSubmitRequest.request = {...request}
			clearTimeout(listener.autoSubmitRequest.abortTimeout);
			tryRequestActionCall(null, listener.autoSubmitRequest, 'autoSubmit', false);

		} else if (listener.autoSubmit) {
			listener.autoSubmitRequest = listener.createApi(null, true, {...request});
			createApiFinish();
		}
	}
}


function onAutoSubmit($form, $element) {
	if (autoSubmitForm.indexOf($form)!==-1) {
		autoSubmitElement[autoSubmitForm.indexOf($form)] = $element;
	}
}


function onAutoSubmitDestroy($form)
{
	if (!isSwapping()) {
		onAutoSubmitAbort($form);
	}
}


function onAutoSubmitAbort($form)
{
	const index = autoSubmitForm.indexOf($form);

	if (index!==-1) {
		autoSubmitForm.splice(index, 1);
		autoSubmitElement.splice(index, 1);
	}

	for (let listener of listeners) {
		if (listener.autoSubmitRequest && listener.autoSubmitRequest.request.$form===$form) {
			tryRequestActionCall(null, listener.autoSubmitRequest, 'abort', true);
			listener.autoSubmitRequest = null;
		}
	}
}


function onRequestStart(requestnum, endpoint, $element, isAjax, isGlobal, abort)
{
	if (appRequestList[requestnum]!==undefined) {
		return false;
	}

	if (autoSubmitForm.indexOf($element)!==-1) {
		$element = autoSubmitElement[autoSubmitForm.indexOf($element)];
	}

	const $form = $element.tagName==='FORM' ? $element : $element.form;
	const formName = $form && ($form.getAttribute('data-ajax') || $form.getAttribute('name')) || null;

	appRequestList[requestnum] = { isAjax, isGlobal, endpoint, $form, $element, formName, labels: {}, level: 0, actions: [], abort }

	const foundListeners = matchListeners(listeners, $element, appRequestList[requestnum], false);

	for (let listener of listeners) {
		if (foundListeners.indexOf(listener)!==-1) {
			listener.labels.forEach(label => appRequestList[requestnum].labels[label] = true);

			const autoSubmitRequest = $form && listener.autoSubmitRequest || null;

			if (autoSubmitRequest) {
				autoSubmitRequest.requestnum = requestnum;
			}

			let nextRequest;

			if (isAjax) {
				nextRequest = autoSubmitRequest || listener.createApi(requestnum, false, {...appRequestList[requestnum]});
				nextRequest && (listener.ajaxRequestList[requestnum] = nextRequest);
				createApiFinish();

			} else if (autoSubmitRequest || (listener.appRequest && listener.appRequest.api.replace)) {
				if (autoSubmitRequest && listener.appRequest!==autoSubmitRequest) {
					tryRequestActionCall(null, listener.appRequest, 'abort', true);
				}

				nextRequest = autoSubmitRequest || listener.appRequest;

				listener.appRequest = nextRequest;
				listener.appRequest.requestnum = requestnum;
				listener.appRequest.request.endpoint = endpoint;
				listener.appRequest.request.$form = $form;
				listener.appRequest.request.$element = $element;
				listener.appRequest.request.abort = abort;
				tryRequestActionCall(null, listener.appRequest, 'replace', false)

			} else {
				tryRequestActionCall(null, listener.appRequest, 'abort', true);
				nextRequest = listener.createApi(requestnum, false, {...appRequestList[requestnum]});
				listener.appRequest = nextRequest;
				createApiFinish();
			}

			listener.autoSubmitRequest = listener.autoSubmitRequest || ($form && nextRequest) || null;

		} else if (listener.appRequest && isAjax===false) {
			listener.appRequest.requestnum = requestnum;
		}
	}
}


function onRequestSubmit(requestnum, form)
{
	onRequestActionInternal(requestnum, 'submit', false, form);
}


function onRequestResponse(requestnum, response) {
	onRequestActionInternal(requestnum, 'response', false, response);
	response.json && onRequestActionInternal(requestnum, 'responseJSON', false, response.json);
	response.html && onRequestActionInternal(requestnum, 'responseHTML', false, response.html);
}


function onRequestActionEnd(requestnum, action, ...args)
{
	onRequestActionInternal(requestnum, action, true, ...args);
	delete appRequestList[requestnum];

	for (let listener of listeners) {
		if (listener.appRequest && listener.appRequest.requestnum===requestnum) {
			listener.appRequest = null;
		}

		if (listener.autoSubmitRequest && listener.autoSubmitRequest.requestnum===requestnum) {
			listener.autoSubmitRequest = null;
		}

		if (Object.keys(listener.ajaxRequestList).length===1) {
			tryRequestActionCall(requestnum, listener.ajaxRequestList[requestnum], 'finish', action==='end');
		}

		delete listener.ajaxRequestList[requestnum];
	}
}


function onRequestActionInternal(requestnum, action, dispose, ...args) {
	if (appRequestList[requestnum]) {
		appRequestList[requestnum].actions.push([action, dispose, ...args]);
	}

	for (let listener of listeners) {
		if (action==='response' && listener.appRequest && listener.appRequest===listener.autoSubmitRequest && listener.appRequest.requestnum===requestnum) {
			listener.autoSubmitRequest = null;
		}

		tryRequestActionCall(requestnum, listener.appRequest, action, dispose, ...args);
		tryRequestActionCall(requestnum, listener.ajaxRequestList[requestnum], action, dispose, ...args);
	}
}


function tryRequestActionCall(requestnum, request, action, dispose, ...args) {
	if (!request || (requestnum!==null && request.requestnum!==requestnum)) {
		return;
	}

	if (action===null && ['abort', 'error', 'end'].indexOf(request.action)===-1) {
		action = request.action==='response' ? 'end' : 'abort';
	}

	try {
		if (action) {
			request.action = action;

			if (request.api[action]) {
				request.api[action](...args);
			}
		}

	} catch (e) {}

	if (dispose && request.api.dispose) {
		request.api.dispose(...args);
	}
}
