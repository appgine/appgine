
import * as errorhub from '../errorhub'
import RequestStack from './RequestStack'

import createOptions from './createOptions'

import { loadMain, update, unload, unloadMain } from './plugins'
import loadHtml from '../lib/loadHtml'
import loadTitle from '../lib/loadTitle'
import createFragment from '../lib/createFragment'
import createTargetScroll from '../lib/swap/createTargetScroll'
import createElementScroll from '../lib/swap/createElementScroll'
import createFormScroll from '../lib/swap/createFormScroll'
import { createSwapping } from '../api/swap'
import { scrollNodeToView, scrollFormToView, setHashFixedEdge, setScrollPosition } from '../lib/scroll'
import * as apiRequest from '../api/request'
import * as apiShortcut from '../api/shortcut'
import * as tick from '../tick'
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

tick.onEachTick(function(screen, updated, done) {

	if (_poping && _poping!==true) {
		const endpoint = closure.uri.create(_poping, {});
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
				internalScrollHashToView(null, request.scrolled);
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

export default function run(options, scrollTo=0, bodyClassName) {
	history.init();

	const _bodyClassName = document.body.className;

	if (bodyClassName!==undefined) {
		document.body.className = bodyClassName;
	}

	_options = createOptions(options);
	_options.initHTML(document.documentElement);

	const html = loadHtml(document.documentElement);

	if (document.body.className!==_bodyClassName) {
		document.body.className = _bodyClassName
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

	if (_options.ignoreURIParams) {
		closure.uri.ignoreURIParams(_options.ignoreURIParams);
	}

	willUpdate(loadMain);

	internalSwap(closure.uri.create(), html, scrollTo);

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

			} else {
				if (_swap) {
					request.swap = null;
					const [_swapUrl, _swapHtml, _swapScrollTo, _swapNewPage] = _swap;

					_swapNewPage && history.changeId();
					internalSwap(_swapUrl, _swapHtml, _swapScrollTo);
					history.canonical(_stack.loadRequest().endpoint, true);
					_options.dispatch('app.request', 'pageview', closure.uri.create());

				} else if (request!==_request) {
					if (closure.uri.getPart(endpoint, 'hash')[0]) {
						request.scrolled = closure.uri.getPart(endpoint, 'hash')[0].substr(1);

					} else {
						request.scrolled = -1;
					}

					internalSwapRequest(request, false);
					history.canonical(request.endpoint, true);
					_options.dispatch('app.request', 'pageview', closure.uri.create());

				} else if (closure.uri.getPart(endpoint, 'hash')[0]) {
					internalScrollHashToView(null, closure.uri.getPart(endpoint, 'hash')[0].substr(1));

				} else {
					request.scrolled = -1;
					request.scrollTop = history.state('scrollTop', 0);
				}

				if (closure.uri.isSame(request.endpoint)===false) {
					willUpdate();
					_pushing = true;
					_poping = endpoint;
				}
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
			internalScrollHashToView($link, hash);
		}
	}
}


export function onClick(e, $link, toTarget) {
	const endpoint = String($link.href||'');

	if (toTarget==='' || toTarget==='_ajax' || toTarget==='_current' || toTarget.indexOf('_this')===0 || toTarget[0]==='#') {
		if (closure.uri.sameOrigin(endpoint)) {
			if (_pending===0 || toTarget==='_ajax' || endpoint!==history.getLink()) {
				const hash = String($link.hash||'').substr(1);
				const endpointWithoutHash = closure.uri.create(endpoint, {}, '');
				const historyWithoutHash = closure.uri.create(history.getLink(), {}, '');

				if (endpointWithoutHash===historyWithoutHash && hash && document.getElementById(hash)) {
					if (toTarget==='' && endpoint!==history.getLink()) {
						pushEndpoint(endpoint);
						_pushing = false;
					}

					e.preventDefault();
					internalScrollHashToView($link, hash);

				} else {
					const clickRequest = apiRequest.createClickRequest(e, $link, endpoint);

					if (!e.defaultPrevented) {
						e.preventDefault();
						loadEndpoint(clickRequest, $link, endpoint, toTarget==='_ajax', toTarget==='_current'||null, createTargetScroll(toTarget));

					} else {
						clickRequest.prevented();
					}
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

	if ((toTarget==='' || toTarget==='_ajax' || toTarget==='_current' || toTarget.indexOf('_this')===0 || toTarget[0]==='#') && 'FormData' in window) {
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
	const endpoint = closure.uri.create(history.getLink(), {});
	const httpRequest = apiRequest.createHttpRequest(document.body, endpoint);
	loadPageWithContext(createAjax(document.body, false), httpRequest, document.body, endpoint, false, _stack.loadRequest() && _stack.loadRequest().scrollTop);
}


export function onLeave(url) {
	_options.onLeave(url);
}


export function location($element, endpoint, isAjax=false) {
	endpoint = closure.uri.create(endpoint, {});

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
	createAjax($element).get(endpoint, bindAjaxRequest(httpRequest, $element, endpoint, 0));
}


export function ajaxPost($element, endpoint, data) {
	endpoint = closure.uri.create(endpoint);

	const httpRequest = apiRequest.createHttpRequest($element, endpoint, data);
	createAjax($element).post(endpoint, data, bindAjaxRequest(httpRequest, $element, endpoint, 0));
}


function loadEndpoint(apiRequest, $element, endpoint, isAjax, toCurrent=null, scrollTo=0) {
	endpoint = history.getCanonizedLink(endpoint);

	if (isAjax) {
		return loadAjax(apiRequest, $element, endpoint, false);

	} else {
		const newPage = pushEndpoint(endpoint, {}, toCurrent) || toCurrent || false;
		return loadPage(apiRequest, $element, endpoint, newPage, scrollTo);
	}
}


function leave(endpoint) {
	const requestnum = ++_requestnum;
	_options.dispatch('app.request', 'start', endpoint, { requestnum });

	if (_options.onRedirect(endpoint)) {
		_options.dispatch('app.request', 'leave', { requestnum });

		if (_pending) {
			_pending = 0;

			if (_pushing) {
				history.cancelState();
			}
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
	_internalScrollHash = '';
	_internalRemoveScroll && _internalRemoveScroll();

	if (_pushing || replacing || (closure.uri.isSame(endpoint) && replacing===null)) {
		history.replaceState({...state, scrollTop: history.state('scrollTop', 0)}, endpoint);
		return false;

	} else {
		_pushing = true;
		_stack.clearForward();
		history.pushState({...state}, endpoint);
		return true;
	}
}


function createAjax($element, allowSwap=true) {
	const headers = {};
	const foundRequest = _stack.findRequest($element);

	if (foundRequest && allowSwap) {
		headers['X-Appgine-Referer'] = foundRequest.endpoint;
	}

	return closure.ajax.createAjax(headers, _options.timeout);
}


function loadAjax(apiRequest, $element, endpoint, scrollTo) {
	loadAjaxWithContext(createAjax($element), apiRequest, $element, endpoint, scrollTo)
}


function loadAjaxWithContext(ajaxContext, apiRequest, $element, endpoint, scrollTo) {
	ajaxContext.load(endpoint, bindAjaxRequest(apiRequest, $element, endpoint, scrollTo));
}


function loadPage(apiRequest, $element, endpoint, newPage, scrollTo) {
	loadPageWithContext(createAjax($element), apiRequest, $element, endpoint, newPage, scrollTo)
}


function loadPageWithContext(ajaxContext, apiRequest, $element, endpoint, newPage, scrollTo) {
	ajaxContext.load(endpoint, bindRequest(apiRequest, $element, endpoint, newPage, scrollTo));
}


function submitForm(submitRequest, $form, $submitter, isAjax=false, toCurrent=false) {
	const $element = $submitter||$form;

	const formName = String($form.name);
	const formId = closure.dom.shouldHaveFormId($form) ? closure.dom.createFormId($form) : null;
	const formEndpoint = closure.uri.createForm($form, $submitter);
	const formMethod = ($form.method||'GET').toUpperCase();
	const formTarget = ($form.target||'');
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

	const elementScroll = createElementScroll($element, true);
	const formScroll = createFormScroll($form, formName[0]==='#', _options.hashFixedEdge);
	const targetScroll = createTargetScroll(formTarget);

	let bindSubmitRequest;
	if (isAjax) {
		bindSubmitRequest = bindAjaxRequest(submitRequest, $element, formEndpoint, function() {
			const $found = closure.dom.findForm(formName, formId);

			if (formTarget==='#') {
				window.scrollTo(0, 0);

			} else if ($found) {
				formScroll($found);
			}
		});

	} else {
		pushEndpoint(formEndpoint, { formId }, !newPage);
		bindSubmitRequest = bindRequest(submitRequest, $element, formEndpoint, newPage, function() {
			const $found = closure.dom.findForm(formName, formId);

			if (targetScroll) {
				targetScroll();

			} else if (formTarget==='#') {
				window.scrollTo(0, 0);

			} else if (formTarget[0]==='#') {
				internalScrollHashToView($element, formTarget.substr(1));

			} else if ($found) {
				if (formTarget.indexOf('_this')===-1) {
					formScroll($found);
				}

			} else if (formId===null) {
				elementScroll(true);

			} else {
				window.scrollTo(0, 0);
			}
		});
	}

	createAjax($element).submit(formEndpoint, formMethod, submitData, function(...response) {
		if ($form.hasAttribute('data-immutable')===false) {
			if (formMethod!=='GET' || _pushing) {
				_stack.clearHistory();
			}
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
		errorhub.dispatch(errorhub.ERROR.REQUEST, 'Failed to handle request.\n' + String(err||''), undefined, endpoint);
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
		errorhub.dispatch(errorhub.ERROR.REQUEST, 'Failed to load requested page.\n' + String(err||''), undefined, endpoint);
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
			if (_pushing && isLast) {
				history.cancelState();
			}

		} else if (response.html || response.json) {
			onResponse(response.html, response.json, response.headers);

		} else if (response.error || response.json===undefined) {
			onError(response.error);

			if (_pushing && isLast) {
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
	const elementScroll = createElementScroll($element);

	return function(text, json, headers) {
		const isCurrent = foundRequest===_stack.loadRequest();

		if (json && json.reload) {
			if (apiRequest.onResponseLeave(closure.uri.create())!==true) {
				leave(closure.uri.create());
			}

		} else if (json && json.refresh) {
			if (isCurrent) {
				canonize($element, json.refresh, newPage, scrollTo);

			} else if (foundRequest) {
				foundRequest.willCanonize($element, json.refresh, newPage, scrollTo);
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
				const swapping = createSwapping(foundRequest, isCurrent);

				if (json && typeof json==='object') {
					Object.keys(json).
						filter(key => String(key).indexOf('swap[')===0).
						forEach(key => swapping.add(key.substr(5, key.length-6), json[key]));

					update((isCurrent && document) || (foundRequest && foundRequest.$fragment) || $element.ownerDocument, $element, json);
				}

				swapping.process();
				wasUpdated();

				if (isCurrent) {
					elementScroll(false);
				}

			} else if (text && isCurrent) {
				if (foundRequest) {
					apiRequest.onResponseSwap(foundRequest);
				}

				_pushing && history.changeId();
				internalSwap(endpoint, text, anchor.join('#')||scrollTo);

			} else if (text && foundRequest) {
				foundRequest.willSwap(endpoint, text, anchor.join('#')||scrollTo, newPage);
			}

			const nowRequest = isCurrent ? _stack.findRequest($element) : foundRequest;

			if (nowRequest && headers) {
				const canonical = headers.match(/link: <(.+)>; rel="canonical"/i);

				if (canonical) {
					nowRequest.endpoint = closure.uri.canonical(canonical[1]);
				}
			}

			if (isCurrent) {
				history.canonical(nowRequest.endpoint, false);

				if (newPage) {
					_options.dispatch('app.request', 'pageview', closure.uri.create());
				}
			}
		}
	}
}


function internalSwap(url, html, scrollTo)
{
	const $fragment = createFragment(html);
	const requestInto = () => _stack.createRequest(_options.createRequest(url, $fragment, scrollTo));

	const $appgineNext = $fragment.querySelector('script[data-appgine]')
	const $appginePrev = document.querySelector('script[data-appgine]');

	if ($appgineNext && $appginePrev && $appgineNext.getAttribute('src')!==$appginePrev.getAttribute('src')) {
		setTimeout(function() {
			Array.from(document.querySelectorAll('script[data-appgine]')).
				forEach($script => $script.parentNode.removeChild($script));

			const $script = document.createElement('script');
			$script.onerror = () => internalSwapRequest(requestInto(), true);
			$script.onload = () => {
				if (typeof window.appgine!=='function') {
					internalSwapRequest(requestInto(), true);

				} else {
					internalDispose();

					const $lastHead = document.createElement('head');
					const $lastBody = document.createElement('body');
					Array.from(document.head.childNodes).filter($child => !($child.hasAttribute && $child.hasAttribute('data-appgine'))).forEach($child => $lastHead.appendChild($child));
					Array.from(document.body.childNodes).forEach($child => $lastBody.appendChild($child));
					Array.from($fragment.querySelector('head').childNodes).forEach($child => document.head.appendChild($child));
					Array.from($fragment.querySelector('body').childNodes).forEach($child => document.body.appendChild($child));
					document.title = loadTitle($fragment);

					window.appgine(scrollTo, $fragment.querySelector('body').className);
				}
			}

			Array.from($appgineNext.attributes).
				filter(attr => ['onload', 'onerror'].indexOf(attr.name)===-1).
				forEach(attr => $script.setAttribute(attr.name, attr.value));

			while (!(document.querySelector('head') || document.documentElement).appendChild);
			(document.querySelector('head') || document.documentElement).appendChild($script);
		}, 0);

	} else {
		internalSwapRequest(requestInto(), true);
	}
}


let _internalScrollHash = '';
let _internalRemoveScroll = null;

function internalSwapRequest(requestInto, isRequestNew) {
	_internalRemoveScroll && _internalRemoveScroll();
	_options.swap(_request, _request=requestInto, isRequestNew);
	internalScrollHash(null, _internalScrollHash, false);

	const $canonical = requestInto.$fragment.querySelector('link[rel="canonical"]');

	if ($canonical) {
		requestInto.endpoint = closure.uri.canonical($canonical.getAttribute('href'));
	}
}


function internalScrollHashToView($origin, hash) {
	$origin = $origin || document.querySelector('a[href="#'+hash+'"]');
	internalScrollHash($origin, hash, true);
}


function internalScrollHash($origin, hash, toView=true) {
	_internalScrollHash = hash;
	_internalRemoveScroll && _internalRemoveScroll();

	const $node = hash && document.getElementById(hash);

	if ($node) {
		_options.onBeforeScroll($node);
		_internalRemoveScroll = function() {
			_internalRemoveScroll = null;
			_options.onRemoveScroll($node);
		}

		if (toView) {
			setHashFixedEdge(_options.hashFixedEdge);
			setScrollPosition(_options.nodeScrollPosition);
			scrollNodeToView($origin, $node, true, () => _internalRemoveScroll && _options.onScroll($node));
		}
	}
}


function internalDispose() {
	_options.onDispose();
	_internalRemoveScroll && _internalRemoveScroll();
	_request = null;
	try { _stack.dispose(); } catch(e) {}
	try { unload(document); } catch(e) {}
	try { unloadMain(); } catch(e) {}
	try { history.dispose(); } catch(e) {}
	try { tick.dispose(); } catch(e) {}
	try { closure.dispose(); } catch(e) {}
	delete window.googNamespace;
}
