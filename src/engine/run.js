
import RequestStack from './RequestStack'

import { loadMain, update } from './plugins'
import loadHtml from '../lib/loadHtml'
import { swap } from '../lib/swap'
import { scrollToView, scrollFormToView } from '../lib/scroll'
import { dispatch } from '../api/channel'
import { onEachTick } from '../tick'
import { willUpdate, wasUpdated } from '../update'
import * as history from './history'

import closure from '../closure'

var _options = {};
var _pending = 0;
var _requestnum = 0;
var _stack = new RequestStack();
var _request = null;
var _poping = null;
var _pushing = false;


onEachTick(function(screen, updated, done) {

	if (_poping && _poping!==true) {
		loadPage(_poping, true, history.state('scrollTop', 0));
		_poping = true;
	}

	if (isRequestCurrent()) {
		const request = _stack.loadRequest();

		if (_poping) {
			_poping = null;
			wasUpdated();

		} else if (request.scrolled!==true) {
			if (typeof request.scrolled === 'string') {
				scrollToView(request.scrolled, true);
				request.scrolled = true;

			} else if (typeof request.scrolled === 'function') {
				request.scrolled();
				request.scrolled = true;

			} else if (screen.top<request.scrolled) {
				request.scrolled = true;

			} else if (screen.top>request.scrollTop && request.scrolled>=0) {
				request.scrolled = true;

			} else if (screen.top>request.scrolled) {
				willUpdate();

				window.requestAnimationFrame(() => {
					if (request.scrolled!==true) {
						request.scrolled = Math.min(request.scrollTop, screen.top);
						window.scrollTo(0, request.scrollTop);
					}

					window.requestAnimationFrame(wasUpdated);
				});

			} else if (done) {
				request.scrolled = true;
			}

		} else if (request.scrollTop!==screen.top) {
			request.scrollTop = screen.top;
			history.mergeState({scrollTop: screen.top});
		}

	} else if (_poping) {
		if (_request && _request.scrollTop!==screen.top) {
			window.scrollTo(0, _request.scrollTop);

		} else {
			_poping = null;
			wasUpdated();
		}
	}
});

export function isRequestCurrent() {
	return _request===_stack.loadRequest();
}

export default function run(options) {
	_options = options;
	const html = loadHtml(document.documentElement);

	willUpdate(loadMain);

	swap(null, _request = _stack.createRequest(closure.uri.create(), html, 0));

	history.popstate(function(e, endpoint) {
		if (_pending) {
			_pending = 0;
			_pushing = false;
			_requestnum++;
			dispatch('app.request', 'abort');
		}

		const request = _stack.loadRequest();

		if (request) {
			const { canonize: _canonize, redirect: _redirect, swap: _swap } = request;

			if (_canonize) {
				_pushing = true;
				request.canonize = null;
				canonize(..._canonize);

			} else if (_redirect) {
				_pushing = true;
				request.redirect = null;
				redirect(..._redirect);

			} else if (_swap) {
				request.swap = null;
				swap(_request, _request = _stack.createRequest(..._swap));
				dispatch('app.request', 'pageview', endpoint);

			} else if (request!==_request) {
				request.scrolled = -1;
				swap(_request, _request = request);
				dispatch('app.request', 'pageview', endpoint);
			}

		} else {
			willUpdate();
			_pushing = true;
			_poping = endpoint;
		}
	});
}


export function onClickHash(hash) {
	scrollToView(hash, true);
}


export function onClick(href) {
	if (_pending===0 || href!==history.getLink()) {
		location(href);
	}
}


export function onSubmitForm(e, $form, $submitter, toTarget) {
	if (toTarget===false && 'FormData' in window) {
		e.preventDefault();
		submitForm($form, $submitter);
	}
}


export function location(endpoint) {
	if (closure.uri.sameOrigin(endpoint)) {
		endpoint = history.getCanonizedLink(endpoint);
		pushEndpoint(endpoint);
		return loadPage(endpoint, true);
	}

	leave(endpoint);
}


export function reload() {
	loadPage(history.getLink(), false, _stack.loadRequest().scrollTop);
}


export function ajaxGet($element, params) {
	const foundRequest = _stack.findRequest($element);
	const endpoint = foundRequest ? closure.uri.create(foundRequest.endpoint, params) : closure.uri.create(params);
	closure.ajax.get(endpoint, bindAjaxRequest($element, endpoint));
}


export function ajaxPost($element, endpoint, data) {
	endpoint = closure.uri.create(endpoint);
	closure.ajax.post(endpoint, data, bindAjaxRequest($element, endpoint));
}


const ajaxResponse = function($element, endpoint, newPage=false, scrollTo=false) {
	const [, anchor] = endpoint.split('#', 2);
	const foundRequest = _stack.findRequest($element);

	return function(text, json) {
		const isCurrent = foundRequest===_stack.loadRequest();

		if (json && json.reload) {
			leave(closure.uri.create());

		} else if (json && json.canonize) {
			if (isCurrent) {
				canonize(json.canonize, newPage, scrollTo);

			} else if (foundRequest) {
				foundRequest.willCanonize(json.canonize, newPage, scrollTo);
			}

		} else if (json && json.redirect) {
			if (isCurrent) {
				redirect(json.redirect, newPage, scrollTo);

			} else if (foundRequest) {
				foundRequest.willRedirect(json.redirect, newPage, scrollTo);
			}

		} else {
			if (json!==undefined) {
				willUpdate();
				update((isCurrent && document) || (foundRequest && foundRequest.$fragment), json);
				wasUpdated();

			} else if (text && isCurrent) {
				swap(_request, _request = _stack.createRequest(endpoint, text, anchor||scrollTo));

			} else if (text && foundRequest) {
				foundRequest.willSwap(endpoint, text, anchor||scrollTo);
			}

			if (isCurrent && newPage) {
				dispatch('app.request', 'pageview', closure.uri.create());
			}
		}
	}
}


function leave(endpoint) {
	const requestnum = ++_requestnum;
	dispatch('app.request', 'start', endpoint);

	if (window.redirect(endpoint)) {
		dispatch('app.request', 'stop');

		if (_pending) {
			_pending = 0;
			history.cancelState();
		}
	}
}


function canonize(endpoint, newPage=false, scrollTo=0) {
	if (closure.uri.sameOrigin(endpoint)) {
		const _newPage = !closure.uri.isSame(endpoint) || newPage;
		history.redirectState({}, endpoint);
		return loadPage(endpoint, _newPage, scrollTo);
	}

	leave(endpoint);
}


function redirect(endpoint, newPage=false, scrollTo=0) {
	if (closure.uri.sameOrigin(endpoint)) {
		const _newPage = !closure.uri.isSame(endpoint) || newPage;
		pushEndpoint(endpoint);
		return loadPage(endpoint, _newPage, scrollTo);
	}

	leave(endpoint);
}


function pushEndpoint(endpoint) {
	if (_pushing || closure.uri.isSame(endpoint)) {
		history.replaceState({scrollTop: history.state('scrollTop', 0)}, endpoint);

	} else {
		_pushing = true;
		_stack.clearForward();
		history.pushState({}, endpoint);
	}
}


function loadPage(endpoint, newPage=false, scrollTo=0) {
	_pending = Math.max(_pending, 1);
	closure.ajax.load(endpoint, bindRequest(document.body, endpoint, newPage, scrollTo));
}


function submitForm($form, $submitter) {
	const endpoint = closure.uri.create($form.getAttribute('action'));
	const newPage = closure.uri.isSame(endpoint)===false;

	pushEndpoint(endpoint);

	const name = $form.name;
	const scrollTo = () => {
		if (name && name[0]!=='#' && document.forms[name]) {
			scrollFormToView(document.forms[name]);

		} else if (name) {
			window.scrollTo(0, 0);
		}
	}

	_pending = Math.max(_pending, 1);
	_stack.clearAll();
	closure.ajax.submit($form, $submitter, bindRequest($form, endpoint, newPage, scrollTo));
}


/**
 * @param {Element}
 */
function bindAjaxRequest($element, endpoint) {
	const response = ajaxResponse($element, endpoint)

	return function(err, text, json) {
		if (text || json) {
			response(text, json);

		} else if (err || json===undefined) {
			_options.onError && _options.onError('Failed to handle request.\n' + String(err||''));
		}
	}
}


/**
 * @param {Element}
 * @param {string}
 * @param {bool}
 * @param {number}
 * @param {bool}
 */
function bindRequest($element, endpoint, newPage=false, scrollTo=0) {
	const requestnum = ++_requestnum;
	const response = ajaxResponse($element, endpoint, newPage, scrollTo);

	if (_pending===1) {
		dispatch('app.request', 'start', endpoint);
		_pending = 2;
	}

	return function(err, text, json) {
		if (text || json) {
			response(text, json);

		} else if (err || json===undefined) {
			_options.onError && _options.onError('Failed to load requested page.\n' + String(err||''));

			if (newPage && requestnum===_requestnum) {
				history.cancelState();
			}
		}

		if (requestnum===_requestnum) {
			_pending = 0;
			_pushing = false;
			dispatch('app.request', 'stop')
		}
	}
}
