
import { dom } from 'appgine/closure'
import { isSwapping } from '../src/update'

import { withModuleContext, useContext } from 'appgine/hooks'
import { useListen } from 'appgine/hooks/channel'
import { useEvent } from 'appgine/hooks/event'
import { bindApi } from 'appgine/hooks/callback'


export function useProgress(ident, api) {
	return useContext(() => createListener(ident, api));
}

const $link = document.createElement('a');

const appRequestList = {};
const listeners = [];

let swapListeners = [];
const autoSubmitForm = [];
const autoSubmitElement = [];

withModuleContext(module, function() {
	useEvent(document, 'focusin', function(e) {
		const found = findListeners(e.target);

		for (let i=0; i<found.length; i++) {
			found[i].state.runned = false;

			if (swapListeners.length>i) {
				found[i].state.runned = swapListeners[i].state.runned;

				if (swapListeners[i].state.appnum>0) {
					found[i].api.tail && found[i].api.tail();
				}
			}
		}

		swapListeners = [];
	});

	useEvent(document, 'focusout', function(e) {
		if (isSwapping()) {
			swapListeners = findListeners(e.target);
			setTimeout(function() {
				swapListeners = [];
			}, 200);
		}
	});

	useListen('auto-submit', 'start', function($form, $element) {
		if (autoSubmitForm.indexOf($form)===-1) {
			autoSubmitForm.push($form);
			autoSubmitElement.push($element);
		}

		for (let listener of findListeners($element)) {
			if (listener.$element && listener.state.runned && listener.state.appnum===-1) {
				listener.api.prestart && listener.api.prestart();
			}
		}
	});


	useListen('auto-submit', 'submit', function($form, $element) {
		if (autoSubmitForm.indexOf($form)!==-1) {
			autoSubmitElement[autoSubmitForm.indexOf($form)] = $element;
		}
	});

	useListen('auto-submit', 'abort', abortAutoSubmit);
	useListen('auto-submit', 'destroy', abortAutoSubmit);

	useListen('app.request', 'start', (endpoint, { $element, requestnum }) => onRequestStart(false, true, endpoint, $element, requestnum));
	useListen('app.request', 'response', ({ requestnum }) => onRequestResponse(requestnum));
	useListen('app.request', 'end', ({ requestnum }) => onRequestEnd(requestnum));
	useListen('app.request', 'abort', ({ requestnum }) => onRequestAbort(requestnum));

	useListen('ajax.request', 'start', function(endpoint, { $element, requestnum, isGlobal }) {
		onRequestStart(true, isGlobal, endpoint, $element, requestnum);
	});

	useListen('ajax.request', 'response', ({ requestnum }) => onRequestResponse(requestnum));
	useListen('ajax.request', 'end', ({ requestnum }) => onRequestEnd(requestnum));
	useListen('ajax.request', 'abort', ({ requestnum }) => onRequestAbort(requestnum));
});


export function createListener(ident, api)
{
	const listener = function() {
		if (listeners.indexOf(listener)!==-1) {
			listeners.splice(listeners.indexOf(listener), 1);
		}
	}

	listeners.push(listener);

	listener.api = bindApi(api || ident);
	listener.$element = null;
	listener.endpoint = [];
	listener.labels = [];
	listener.state = {
		appnum: -1,
		ajaxnum: [],
		runned: false,
	}

	if (listener.api && ident) {
		if (ident.$element) {
			listener.$element = ident.$element;
		}

		if (ident.labels) {
			listener.labels = Array.isArray(ident.labels) ? ident.labels : [ident.labels];
		}

		if (ident.label) {
			listener.labels.push(ident.label);
		}

		if (ident.endpoint) {
			listener.endpoint = Array.isArray(ident.endpoint) ? ident.endpoint : [ident.endpoint];
			listener.endpoint = listener.endpoint.map(endpoint => {
				$link.href = endpoint;
				$link.href = $link.href;
				return $link.href;
			});
		}
	}

	for (let requestnum of Object.keys(appRequestList)) {
		requestnum = parseInt(requestnum, 10);
		const request = appRequestList[requestnum]

		const matchFn = listener => listener.labels.some(label => request.labels[label]);
		const [found, foundLevel] = matchListners([listener], request.$element, request.endpoint, request.allowGlobal, matchFn);

		if (found.length>0 && (request.level===0 || foundLevel>=request.level)) {
			request.level = foundLevel;
			for (let label of listener.labels) {
				request.labels[label] = true;
			}

			listener.api.start && listener.api.start();
			listener.state.runned = true;

			if (request.isAjax) {
				listener.state.ajaxnum.push(requestnum);

			} else {
				listener.state.appnum = requestnum;
			}
		}
	}

	return listener;
}


function matchListners(listeners, $element, endpoint, allowGlobal, matchFn)
{
	let selector;
	if (endpoint) {
		$link.href = endpoint;
		$link.href = $link.href;

		endpoint = $link.href;
		selector = 'a[href="'+endpoint.replace(/["\\]/g, '\\$&')+'"]';
	}

	let foundLevel = 0;
	let found = [];
	for (let listener of listeners) {
		let matched = matchFn ? matchFn(listener) : false;
		if (endpoint && listener.endpoint.indexOf(endpoint)!==-1) {
			matched = true;

		} else if (selector && listener.$element && listener.$element.querySelector(selector)) {
			matched = true;

		} else if (listener.$element) {
			matched = matched || !!($element && dom.contains(listener.$element, $element));

		} else if (allowGlobal) {
			matched = matched || listener.endpoint.length===0;
		}

		if (matched) {
			if (listener.$element) {
				let elementLevel = 0;
				let $tmp = listener.$element;
				do { ++elementLevel } while (($tmp = $tmp.parentNode) && $tmp.tagName!=='BODY');

				if (foundLevel===elementLevel) {
					found.push(listener);

				} else if (foundLevel===0 || elementLevel>foundLevel) {
					foundLevel = elementLevel;
					found = [listener];
				}

			} else if (foundLevel===0) {
				found.push(listener);
			}
		}
	}

	return [found, foundLevel];
}


function findListeners($element) {
	return matchListners(listeners, $element)[0];
}


function abortAutoSubmit($form) {
	const index = autoSubmitForm.indexOf($form);

	if (index!==-1) {
		for (let listener of findListeners(autoSubmitElement[index])) {
			if (listener.$element && listener.state.runned && listener.state.appnum===-1) {
				listener.api.prestart && listener.api.abort && listener.api.abort();
			}
		}

		autoSubmitForm.splice(index, 1);
		autoSubmitElement.splice(index, 1);
	}
}


function onRequestStart(isAjax, isGlobal, endpoint, $element, requestnum) {
	if (appRequestList[requestnum]!==undefined) {
		return false;
	}

	for (let request of Object.values(appRequestList)) {
		if (isAjax===false && request.isAjax===false && request.requestnum<requestnum) {
			delete appRequestList[appRequestList.indexOf(request)];
		}
	}

	if (autoSubmitForm.indexOf($element)!==-1) {
		$element = autoSubmitElement[autoSubmitForm.indexOf($element)];
	}

	const [found, foundLevel] = matchListners(listeners, $element, isAjax || $element.tagName==='A' ? endpoint : null, isGlobal);

	appRequestList[requestnum] = { isAjax, isGlobal, endpoint, $element, labels: {}, level: foundLevel };

	for (let listener of listeners) {
		if (found.indexOf(listener)!==-1) {
			if (requestnum>listener.state.appnum) {
				for (let label of listener.labels) {
					appRequestList[requestnum].labels[label] = true;
				}

				if (listener.state.appnum>-1 || listener.state.ajaxnum.length>0) {
					listener.api.restart && listener.api.restart();

				} else {
					listener.api.start && listener.api.start();
				}

				listener.state.runned = true;

				if (isAjax) {
					listener.state.ajaxnum.push(requestnum);

				} else {
					listener.state.appnum = requestnum;
				}
			}

		} else if (isAjax===false && listener.state.appnum>0 && listener.state.appnum<requestnum) {
			listener.state.appnum = requestnum;
		}
	}
}


function onRequestResponse(requestnum) {
	for (let listener of listeners) {
		if (listener.state.appnum===requestnum) {
			listener.api.response && listener.api.response();
		}
	}
}


function onRequestEnd(requestnum) {
	setTimeout(() => onRequestEndOrAbort(requestnum, 'end'), 100);
}


function onRequestAbort(requestnum) {
	onRequestEndOrAbort(requestnum, 'abort');
}

function onRequestEndOrAbort(requestnum, type) {
	if (appRequestList[requestnum]) {
		delete appRequestList[requestnum];

		for (let listener of listeners) {
			let ended = false;
			if (listener.state.appnum===requestnum) {
				listener.state.appnum = -1;
				ended = true;

			} else if (listener.state.ajaxnum.indexOf(requestnum)!==-1) {
				listener.state.ajaxnum.splice(listener.state.ajaxnum.indexOf(requestnum), 1);
				ended = true;
			}

			if (ended && listener.state.appnum===-1 && listener.state.ajaxnum.length===0) {
				listener.api[type] && listener.api[type]();
			}
		}
	}
}
