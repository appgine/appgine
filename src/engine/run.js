
import RequestStack from './RequestStack'

import createOptions from './createOptions'

import { loadMain, update } from './plugins'
import loadHtml from '../lib/loadHtml'
import { scrollHashToView, scrollFormToView } from '../lib/scroll'
import * as apiRequest from '../api/request'
import * as apiShortcut from '../api/shortcut'
import { onEachTick } from '../tick'
import { willUpdate, wasUpdated } from '../update'
import * as history from './history'

import closure from '../closure'

var _options = createOptions({});
var _pending = 0;
var _requestnum = 0;
var _stack = new RequestStack();
var _request = null;
var _poping = null;
var _pushing = false;

export const requestStack = _stack;

onEachTick(function(screen, updated, done) {

	if (_poping && _poping!==true) {
		const endpoint = closure.uri.create(_poping, {}, '');
		const httpRequest = apiRequest.createHttpRequest(document.body, endpoint);
		loadPage(httpRequest, document.body, endpoint, true, history.state('scrollTop', 0));
		_poping = true;
	}

	if (isRequestCurrent()) {
		const request = _stack.loadRequest();

		if (_poping) {
			_poping = null;
			wasUpdated();

		} else if (request.scrolled!==true) {
			if (typeof request.scrolled === 'string') {
				scrollHashToView(request.scrolled, true);
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

		} else if (history.state('scrollTop', 0)!==screen.top) {
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

export function option(name) {
	return _options[name];
}

export function isRequestCurrent() {
	return _request===_stack.loadRequest();
}

export default function run(options) {
	_options = createOptions(options);
	_options.initHTML(document.documentElement);

	if (_options.timeout) {
		closure.ajax.setTimeout(_options.timeout);
	}

	if (_options.abortOnEscape) {
		apiShortcut.listen('esc', function(e) {
			if (_pending) {
				e.stopPropagation();
				e.preventDefault();
				closure.ajax.abort();
			}
		});
	}

	const html = loadHtml(document.documentElement);

	willUpdate(loadMain);

	_options.swap(null, _request = _stack.createRequest(_options.createRequest(closure.uri.create(), html, 0)));

	history.popstate(function(e, endpoint) {
		if (_pending) {
			_pending = 0;
			_pushing = false;
			_requestnum++;
			_options.dispatch('app.request', 'abort');
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
				const [_swapUrl, _swapHtml, _swapScrollTo, _swapNewPage] = _swap;

				_swapNewPage && history.changeId();
				_options.swap(_request, _request = _stack.createRequest(_options.createRequest(_swapUrl, _swapHtml, _swapScrollTo)));
				_options.dispatch('app.request', 'pageview', endpoint);

			} else if (request!==_request) {
				request.scrolled = -1;
				_options.swap(_request, _request = request);
				_options.dispatch('app.request', 'pageview', endpoint);

			} else {
				request.scrolled = -1;
				request.scrollTop = history.state('scrollTop', 0);
			}

		} else {
			willUpdate();
			_pushing = true;
			_poping = endpoint;
		}
	});
}


export function onClickHash(e, $link, hash, toTarget) {
	if (toTarget==='' || toTarget==='_ajax' || toTarget==='_current') {
		const endpoint = closure.uri.create('', {}, hash);

		if (toTarget==='' && endpoint!==history.getLink()) {
			pushEndpoint(endpoint);
			_pushing = false;
		}

		if (_stack.loadRequest() && _stack.loadRequest().shouldReloadForHash(hash)) {
			const clickRequest = apiRequest.createClickRequest(e, $link, endpoint);

			if (!e.defaultPrevented) {
				e.preventDefault();
				loadPage(clickRequest, $link, endpoint, false, 0);
			}

		} else {
			e.preventDefault();
			scrollHashToView(hash, true);
		}
	}
}


export function onClick(e, $link, toTarget) {
	const endpoint = String($link.href||'');

	if (toTarget==='' || toTarget==='_ajax' || toTarget==='_current') {
		if (closure.uri.sameOrigin(endpoint)) {
			if (_pending===0 || toTarget==='_ajax' || endpoint!==history.getLink()) {
				const clickRequest = apiRequest.createClickRequest(e, $link, endpoint);

				if (!e.defaultPrevented) {
					e.preventDefault();
					loadEndpoint(clickRequest, $link, endpoint, toTarget==='_ajax', toTarget==='_current'||null);

				} else {
					clickRequest.prevented();
				}

			} else {
				e.preventDefault();
			}

		} else if (leave(endpoint)) {
			e.preventDefault();
		}
	}
}


export function onSubmitForm(e, $form, $submitter, toTarget) {
	const endpoint = closure.uri.createForm($form, $submitter);

	if ((toTarget==='' || toTarget==='_ajax' || toTarget==='_current') && 'FormData' in window) {
		if (closure.uri.sameOrigin(endpoint)) {
			const submitRequest = apiRequest.createSubmitRequest(e, $form, $submitter, endpoint);

			if (!e.defaultPrevented) {
				e.preventDefault();
				submitForm(submitRequest, $form, $submitter, toTarget==='_ajax', toTarget==='_current');

			} else {
				submitRequest.prevented();
			}
		}
	}
}


export function onReload() {
	const endpoint = closure.uri.create(history.getLink(), {}, '');
	const httpRequest = apiRequest.createHttpRequest(document.body, endpoint);
	loadPage(httpRequest, document.body, endpoint, false, _stack.loadRequest() && _stack.loadRequest().scrollTop);
}


export function location($element, endpoint, isAjax=false) {
	endpoint = closure.uri.create(endpoint, {}, '');

	if (closure.uri.sameOrigin(endpoint)) {
		const httpRequest = apiRequest.createHttpRequest($element, endpoint);
		loadEndpoint(httpRequest, $element, endpoint, isAjax);

	} else {
		leave(endpoint);
	}
}


export function ajaxGet($element, params) {
	const foundRequest = _stack.findRequest($element);
	const endpoint = foundRequest ? closure.uri.create(foundRequest.endpoint, params) : closure.uri.create(params);

	const httpRequest = apiRequest.createHttpRequest($element, endpoint);
	closure.ajax.get(endpoint, bindAjaxRequest(httpRequest, $element, endpoint, 0));
}


export function ajaxPost($element, endpoint, data) {
	endpoint = closure.uri.create(endpoint);

	const httpRequest = apiRequest.createHttpRequest($element, endpoint, data);
	closure.ajax.post(endpoint, data, bindAjaxRequest(httpRequest, $element, endpoint, 0));
}


function loadEndpoint(apiRequest, $element, endpoint, isAjax, toCurrent=null) {
	endpoint = history.getCanonizedLink(endpoint);

	if (isAjax) {
		return loadAjax(apiRequest, $element, endpoint, false);

	} else {
		const newPage = pushEndpoint(endpoint, {}, toCurrent);
		return loadPage(apiRequest, $element, endpoint, newPage, 0);
	}
}


function leave(endpoint) {
	const requestnum = ++_requestnum;
	_options.dispatch('app.request', 'start', endpoint, { requestnum });

	if (_options.onRedirect(endpoint)) {
		_options.dispatch('app.request', 'stop', { requestnum });

		if (_pending) {
			_pending = 0;
			history.cancelState();
		}

		return true;
	}

	return false;
}


function canonize($element, endpoint, newPage=false, scrollTo=0) {
	if (closure.uri.sameOrigin(endpoint)) {
		const _newPage = !closure.uri.isSame(endpoint) || newPage;
		history.redirectState({}, endpoint);
		const httpRequest = apiRequest.createHttpRequest($element||document.body, endpoint);
		return loadPage(httpRequest, $element||document.body, endpoint, _newPage, scrollTo);
	}

	leave(endpoint);
}


function redirect($element, endpoint, newPage=false, scrollTo=0) {
	if (closure.uri.sameOrigin(endpoint)) {
		const _newPage = !closure.uri.isSame(endpoint) || newPage;
		pushEndpoint(endpoint);
		const httpRequest = apiRequest.createHttpRequest($element||document.body, endpoint);
		return loadPage(httpRequest, $element||document.body, endpoint, _newPage, (_newPage>newPage && scrollTo===false) ? 0 : scrollTo);
	}

	leave(endpoint);
}


function pushEndpoint(endpoint, state={}, replacing=null) {
	if (_pushing || replacing || (closure.uri.isSame(endpoint) && replacing===null)) {
		_pushing = true;
		history.replaceState({...state, scrollTop: history.state('scrollTop', 0)}, endpoint);
		return false;

	} else {
		_pushing = true;
		_stack.clearForward();
		history.pushState({...state}, endpoint);
		return true;
	}
}


function loadAjax(apiRequest, $element, endpoint, scrollTo) {
	closure.ajax.load(endpoint, bindAjaxRequest(apiRequest, $element, endpoint, scrollTo));
}


function loadPage(apiRequest, $element, endpoint, newPage, scrollTo) {
	closure.ajax.load(endpoint, bindRequest(apiRequest, $element, endpoint, newPage, scrollTo));
}


function submitForm(submitRequest, $form, $submitter, isAjax=false, toCurrent=false) {
	const $element = $submitter||$form;

	const formName = String($form.name);
	const formId = closure.dom.shouldHaveFormId($form) ? closure.dom.createFormId($form) : null;
	const formEndpoint = closure.uri.createForm($form, $submitter);
	const formMethod = ($form.method||'GET').toUpperCase();
	const formData = closure.form.postData($form, $submitter);

	let newPage;
	if (toCurrent) {
		newPage = false;

	} else if (closure.uri.isSame(formEndpoint) && formId===null) {
		newPage = false;

	} else if (formId && history.state('formId')===formId) {
		newPage = false;

	} else {
		newPage = true;
	}

	const submitData = formMethod==='POST' ? _options.onFormData(formData) : '';

	let bindSubmitRequest;
	if (isAjax) {
		bindSubmitRequest = bindAjaxRequest(submitRequest, $element, formEndpoint, function() {
			const $found = closure.dom.findForm(formName, formId);

			if ($found && formName[0]==='#') {
				scrollFormToView($found, true);
			}
		});

	} else {
		pushEndpoint(formEndpoint, { formId }, !newPage);
		bindSubmitRequest = bindRequest(submitRequest, $element, formEndpoint, newPage, function() {
			const $found = closure.dom.findForm(formName, formId);

			if ($found) {
				scrollFormToView($found, formName[0]==='#');

			} else {
				window.scrollTo(0, 0);
			}
		});
	}

	const currentRequest = _stack.loadRequest();

	closure.ajax.submit(formEndpoint, formMethod, submitData, function(...response) {
		if (formMethod!=='GET' || _pushing) {
			_stack.clearHistory(true);
		}

		bindSubmitRequest(...response);
	});
}


/**
 * @param {object}
 * @param {Element}
 * @param {string}
 * @param {mixed}
 */
function bindAjaxRequest(apiRequest, $element, endpoint, scrollTo) {
	return _bindRequest(apiRequest, _pushing ? 0 : ++_requestnum, $element, endpoint, false, scrollTo, function(err) {
		_options.onError('Failed to handle request.\n' + String(err||''));
	});
}


/**
 * @param {object}
 * @param {Element}
 * @param {string}
 * @param {bool}
 * @param {mixed}
 */
 function bindRequest(apiRequest, $element, endpoint, newPage, scrollTo) {
	return _bindRequest(apiRequest, ++_requestnum, $element, endpoint, newPage, scrollTo, function(err) {
		_options.onError('Failed to load requested page.\n' + String(err||''));
	});
}


/**
 * @param {object}
 * @param {int}
 * @param {Element}
 * @param {string}
 * @param {bool}
 * @param {mixed}
 * @param {function}
 */
function _bindRequest(apiRequest, requestnum, $element, endpoint, newPage, scrollTo, onError) {
	const onResponse = ajaxResponse(apiRequest, $element, endpoint, newPage, scrollTo);

	_pending = 1;
	_options.dispatch('app.request', 'start', endpoint, { $element, requestnum });

	return _options.onResponse(function(status, response) {
		const isLast = requestnum===_requestnum;
		apiRequest.onResponse(status, response, isLast);

		if (status===closure.ajax.ABORT) {
			if (newPage && isLast) {
				history.cancelState();
			}

		} else if (response.html || response.json) {
			onResponse(response.html, response.json);

		} else if (response.error || response.json===undefined) {
			onError(response.error);

			if (newPage && isLast) {
				history.cancelState();
			}
		}

		if (isLast) {
			_pending = 0;
			_pushing = false;
		}

		apiRequest.onComplete(isLast)
		_options.dispatch('app.request', 'stop', { $element, requestnum });
	})
}


function ajaxResponse(apiRequest, $element, endpoint, newPage, scrollTo) {
	const [, ...anchor] = endpoint.split('#');
	const foundRequest = _stack.findRequest($element);

	return function(text, json) {
		const isCurrent = foundRequest===_stack.loadRequest();

		if (json && json.reload) {
			if (apiRequest.onResponseLeave(closure.uri.create())!==true) {
				leave(closure.uri.create());
			}

		} else if (json && json.canonize) {
			if (isCurrent) {
				if (apiRequest.onResponseCanonize(json.canonize)!==true) {
					canonize($element, json.canonize, newPage, scrollTo);
				}

			} else if (foundRequest) {
				foundRequest.willCanonize($element, json.canonize, newPage, scrollTo);
			}

		} else if (json && json.redirect) {
			if (isCurrent) {
				if (apiRequest.onResponseRedirect(json.redirect)!==true) {
					redirect($element, json.redirect, newPage, scrollTo);
				}

			} else if (foundRequest) {
				foundRequest.willRedirect($element, json.redirect, newPage, scrollTo);
			}

		} else {
			if (json!==undefined) {
				apiRequest.onResponseUpdate();
				willUpdate();
				update((isCurrent && document) || (foundRequest && foundRequest.$fragment) || $element.ownerDocument, $element, json);
				wasUpdated();

			} else if (text && isCurrent) {
				if (foundRequest) {
					apiRequest.onResponseSwap(foundRequest);
				}

				newPage && history.changeId();
				_options.swap(_request, _request = _stack.createRequest(_options.createRequest(endpoint, text, anchor.join('#')||scrollTo)));

			} else if (text && foundRequest) {
				foundRequest.willSwap(endpoint, text, anchor.join('#')||scrollTo, newPage);
			}

			if (isCurrent && newPage) {
				_options.dispatch('app.request', 'pageview', closure.uri.create());
			}
		}
	}
}
