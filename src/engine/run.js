
import * as errorhub from '../errorhub'
import RequestStack from './RequestStack'

import createOptions from './createOptions'
import { locale } from '../locale'

import { loadMain, update, unload, unloadMain } from './plugins'
import loadHtml from '../lib/loadHtml'
import loadTitle from '../lib/loadTitle'
import createFragment from '../lib/createFragment'
import createTargetScroll from '../lib/swap/createTargetScroll'
import createElementScroll from '../lib/swap/createElementScroll'
import createFormScroll from '../lib/swap/createFormScroll'

import { scrollNodeToView, setHashFixedEdge, setScrollPosition } from '../lib/scroll'
import * as apiShortcut from 'appgine/hooks/shortcut'
import { scrollTo as windowScrollTo } from 'appgine/hooks/window'
import * as tick from '../tick'
import { willUpdate, wasUpdated } from '../update'
import createRequestnum from '../requestnum'
import * as history from './history'

import React from 'appgine/react'
import * as uri from './uri'
import * as forms from 'appgine/utils/forms'
import * as formDataUtils from 'appgine/utils/formData'
import * as ajax from '../lib/ajax'

const _stack = new RequestStack();
let _options = createOptions({});
let _pending = 0;
let _requestnum = 0;
let _request = null;
let _poping = null;
let _pushing = false;

export const requestStack = _stack;

tick.onEachTick(function(screen, updated, done) {

	if (_poping && _poping!==true) {
		const endpoint = uri.create(_poping, {});
		loadPage(document.body, endpoint, true, history.state('scrollTop', 0));
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

			} else if (request.scrolled instanceof Element) {
				internalScrollNode(request.scrolled, request.scrolled);
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
						windowScrollTo(0, request.scrollTop);
					}

					window.requestAnimationFrame(wasUpdated);
				});

			} else if (done) {
				request.scrolled = true;
			}

			if (request.scrolled===true) {
				request.scrollTop = screen.top;
				history.mergeState({scrollTop: screen.top});
			}

		} else if (history.state('scrollTop', 0)!==screen.top) {
			request.scrollTop = screen.top;
			history.mergeState({scrollTop: screen.top});
		}

	} else if (_poping) {
		if (_request && _request.scrollTop!==screen.top) {
			windowScrollTo(0, _request.scrollTop);

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

export default function run(options, scrollTo=0, bodyClassName, isRequestInitial) {
	if (bodyClassName===null) {
		Array.from(document.querySelectorAll('script[data-runtime]')).forEach($script => $script.removeAttribute('data-runtime'));

	} else {
		document.body.className = bodyClassName;
	}

	_options = createOptions(options);
	_options.initHTML(document.documentElement);

	const html = loadHtml(document.documentElement);

	if (_options.abortOnEscape) {
		apiShortcut.listen('esc', function(e) {
			if (_pending) {
				e.stopPropagation();
				e.preventDefault();
				ajax.abort();
			}
		});
	}

	willUpdate(loadMain);

	internalSwap(uri.create(), html, scrollTo, isRequestInitial);

	history.popstate(function(e, endpoint, initial) {
		if (initial && _stack.loadRequest()) {
			return history.canonical(_stack.loadRequest().endpoint, false);
		}

		if (_pending) {
			_pending = 0;
			_pushing = false;
			_options.dispatch('app.request', 'abort', { requestnum: _requestnum });
			_requestnum = createRequestnum();
		}

		const request = _stack.loadRequest();

		if (request) {
			const { canonize: _canonize, redirect: _redirect, swap: _swap } = request;
			request.canonize = null;
			request.redirect = null;
			request.swap = null;

			if (_canonize) {
				_pushing = true;
				canonize(..._canonize);

			} else if (_redirect) {
				_pushing = true;
				redirect(..._redirect);

			} else {
				if (_swap) {
					const [_swapUrl, _swapHtml, _swapScrollTo, _swapNewPage] = _swap;

					_swapNewPage && history.changeId();
					internalSwap(_swapUrl, _swapHtml, _swapScrollTo, false);
					history.canonical(_stack.loadRequest().endpoint, true);
					_options.dispatch('app.request', 'pageview', uri.create());

				} else if (request!==_request) {
					if (uri.getHash(endpoint)) {
						request.scrolled = uri.getHash(endpoint).substr(1);

					} else {
						request.scrolled = -1;
					}

					internalSwapRequest(request, false, false);
					history.canonical(request.endpoint, true);
					_options.dispatch('app.request', 'pageview', uri.create());

				} else if (uri.getHash(endpoint)) {
					internalScrollHashToView(null, uri.getHash(endpoint).substr(1));

				} else {
					request.scrolled = -1;
					request.scrollTop = history.state('scrollTop', 0);
				}

				if (uri.isSame(request.endpoint)===false) {
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
		const endpoint = uri.create('', {}, hash);

		if (toTarget==='' && endpoint!==history.getLink()) {
			pushEndpoint(endpoint);
			_pushing = false;
		}

		if (_stack.loadRequest() && _stack.loadRequest().shouldReloadForHash(hash)) {
			e.preventDefault();
			loadPage($link, endpoint, false, 0);

		} else {
			e.preventDefault();
			internalScrollHashToView($link, hash);
		}
	}
}


export function onClick(e, $link, toTarget) {
	const endpoint = String($link.href||'');

	if (toTarget==='' || toTarget==='_ajax' || toTarget==='_current' || toTarget.indexOf('_this')===0 || toTarget[0]==='#') {
		if (uri.sameOrigin(endpoint)) {
			if (_pending===0 || toTarget==='_ajax' || endpoint!==history.getLink()) {
				const hash = String($link.hash||'').substr(1);
				const endpointWithoutHash = uri.create(endpoint, {}, '');
				const historyWithoutHash = uri.create(history.getLink(), {}, '');

				if (endpointWithoutHash===historyWithoutHash && hash && document.getElementById(hash)) {
					if (toTarget==='' && endpoint!==history.getLink()) {
						pushEndpoint(endpoint);
						_pushing = false;
					}

					e.preventDefault();
					internalScrollHashToView($link, hash);

				} else {
					e.preventDefault();
					loadEndpoint($link, endpoint, toTarget==='_ajax', toTarget==='_current'||null, hash||createTargetScroll(toTarget));
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
	const endpoint = uri.createForm($form, $submitter);

	if ((toTarget==='' || toTarget==='_ajax' || toTarget==='_current' || toTarget.indexOf('_this')===0 || toTarget[0]==='#') && 'FormData' in window) {
		if (uri.sameOrigin(endpoint)) {
			e.preventDefault();
			submitForm($form, $submitter, toTarget||'');
		}
	}
}


export function onReload() {
	const endpoint = uri.create(history.getLink(), {});
	loadPageWithContext(createAjax(document.body, false), document.body, endpoint, false, false);
}


export function onLeave(url) {
	_options.onLeave(url);
}


export function onRedirect($element, url)
{
	const endpoint = uri.create(url, {});

	if (_options.ajax!==false && uri.sameOrigin(endpoint)) {
		loadEndpoint($element, endpoint, isAjax);

	} else {
		_options.onLeave(url);
	}
}


// deprecated
export function location($element, url) {
	onRedirect($element, url);
}


export function scroll($element, animated)
{
	internalScrollNode($element, $element, true, animated);
}


function loadEndpoint($element, endpoint, isAjax, toCurrent=null, scrollTo=0) {
	endpoint = history.getCanonizedLink(endpoint);

	if (isAjax) {
		return loadAjax($element, endpoint, false);

	} else {
		const newPage = pushEndpoint(endpoint, {}, toCurrent) || toCurrent || false;
		return loadPage($element, endpoint, newPage, scrollTo);
	}
}


function leave(endpoint) {
	let aborted = false;
	const requestnum = _requestnum = createRequestnum();
	_options.dispatch('app.request', 'start', endpoint, { requestnum, isAjax: false, $element: document.body, abort() {
		aborted = true;
	} });

	if (aborted===false && _options.onRedirect(endpoint)) {
		_options.dispatch('app.request', 'leave', { requestnum });

		if (_pending) {
			_pending = 0;

			if (_pushing) {
				// history.cancelState();
			}
		}

		return true;
	}

	return false;
}


function canonize($element, endpoint, newPage=false, scrollTo=0) {
	if (uri.sameOrigin(endpoint)) {
		const _newPage = !uri.isSame(endpoint) || newPage;
		history.redirectState({}, endpoint);
		return loadPage($element||document.body, endpoint, _newPage, scrollTo);
	}

	leave(endpoint);
}


function redirect($element, endpoint, newPage=false, scrollTo=0) {
	if (uri.sameOrigin(endpoint)) {
		const _newPage = !uri.isSame(endpoint) || newPage;
		pushEndpoint(endpoint);
		return loadPageWithContext(createAjax($element, false), $element||document.body, endpoint, _newPage, (_newPage>newPage && scrollTo===false) ? 0 : scrollTo);
	}

	leave(endpoint);
}


function pushEndpoint(endpoint, state={}, replacing=null) {
	_internalScrollHash = '';
	_internalRemoveScroll && _internalRemoveScroll();

	if (_pushing || replacing || (uri.isSame(endpoint) && replacing===null)) {
		history.replaceState({...state, scrollTop: history.state('scrollTop', 0)}, endpoint);
		return false;

	} else {
		_pushing = true;
		_stack.clearForward();
		history.pushState({...state}, endpoint);
		return true;
	}
}


function createAjax($element, allowSwap=true, name=null) {
	const headers = {};
	const foundRequest = _stack.findRequest($element);

	if (foundRequest && allowSwap) {
		headers['X-Appgine-Referer'] = foundRequest.endpoint;
	}

	if ($element && $element.getAttribute('data-tracker')) {
		headers['X-Request-Tracker'] = $element.getAttribute('data-tracker');
	}

	return ajax.create(headers, _options.timeout, name);
}


function loadAjax($element, endpoint, scrollTo) {
	loadAjaxWithContext(createAjax($element), $element, endpoint, scrollTo)
}


function loadAjaxWithContext(ajaxContext, $element, endpoint, scrollTo) {
	ajaxContext.get(endpoint, bindAjaxRequest(ajaxContext, $element, endpoint, scrollTo));
}


function loadPage($element, endpoint, newPage, scrollTo) {
	loadPageWithContext(createAjax($element), $element, endpoint, newPage, scrollTo)
}


function loadPageWithContext(ajaxContext, $element, endpoint, newPage, scrollTo) {
	ajaxContext.load(endpoint, bindRequest(ajaxContext, $element, endpoint, newPage, scrollTo));
}


function submitForm($form, $submitter, formTarget) {
	const $element = $submitter||$form;

	const formName = String($form.name);
	const formId = forms.shouldHaveFormId($form) ? forms.createFormId($form) : null;
	const formEndpoint = uri.createForm($form, $submitter);
	const formMethod = (($submitter && $submitter.formmethod) || $form.method || 'GET').toUpperCase();
	const formData = formDataUtils.postData($form, $submitter);

	let newPage;
	if (formTarget==='_current') {
		newPage = false;

	} else if (uri.isSame(formEndpoint) && formId===null) {
		newPage = false;

	} else if (formId && history.state('formId')===formId) {
		newPage = false;

	} else {
		newPage = true;
	}

	const submitData = formMethod==='POST' ? _options.onFormData(formData) : null;

	const elementScroll = createElementScroll($element, true, _options.hashFixedEdge);
	const formScroll = createFormScroll($form, formName[0]==='#', _options.hashFixedEdge);
	const targetScroll = createTargetScroll(formTarget);

	const ajaxContext = createAjax($element, true, $form.getAttribute('data-ajax')||null);

	let bindSubmitRequest;
	if (formTarget==='_ajax') {
		bindSubmitRequest = bindAjaxRequest(ajaxContext, $element, formEndpoint, function() {
			const $found = forms.findForm(formName, formId);

			if (formTarget==='#') {
				windowScrollTo(0, 0);

			} else if ($found) {
				formScroll($found);
			}
		});

	} else {
		pushEndpoint(formEndpoint, { formId }, !newPage);
		bindSubmitRequest = bindRequest(ajaxContext, $element, formEndpoint, newPage, function() {
			const $found = forms.findForm(formName, formId);

			if (targetScroll) {
				targetScroll();

			} else if (formTarget==='#') {
				windowScrollTo(0, 0);

			} else if (formTarget[0]==='#') {
				internalScrollHashToView($element, formTarget.substr(1));

			} else if ($found) {
				if (formTarget.indexOf('_this')===-1) {
					formScroll($found);
				}

			} else if (formId===null) {
				elementScroll(true);

			} else {
				windowScrollTo(0, 0);
			}
		});
	}

	const requestnum = _requestnum;

	_options.dispatch('app.request', 'submit', { requestnum, endpoint: formEndpoint, method: formMethod, data: formData });

	ajaxContext.submit(formEndpoint, formMethod, submitData, function(...response) {
		if ($form.hasAttribute('data-immutable')===false) {
			if (formMethod!=='GET' || _pushing) {
				_stack.clearHistory();
			}
		}

		bindSubmitRequest(...response);
	}, function(loaded, total) {
		_options.dispatch('app.request', 'upload', { requestnum, loaded, total });
	});
}


function bindAjaxRequest(ajaxContext, $element, endpoint, scrollTo) {
	return _bindRequest(true, ajaxContext, _pushing ? 0 : (_requestnum = createRequestnum()), $element, endpoint, false, scrollTo, function(errno) {
		const error = _options.locale[locale.error.request.ajax] + '\n' + String(_options.locale[errno]||'');
		errorhub.dispatch(errorhub.ERROR.REQUEST, error, undefined, endpoint);
	});
}



function bindRequest(ajaxContext, $element, endpoint, newPage, scrollTo) {
	return _bindRequest(false, ajaxContext, (_requestnum = createRequestnum()), $element, endpoint, newPage, scrollTo, function(errno) {
		const error = _options.locale[locale.error.request.page] + '\n' + String(_options.locale[errno]||'');
		errorhub.dispatch(errorhub.ERROR.REQUEST, error, undefined, endpoint);
	});
}


function _bindRequest(isAjax, ajaxContext, requestnum, $element, endpoint, newPage, scrollTo, onError) {
	const onResponse = ajaxResponse($element, endpoint, newPage, scrollTo);

	_pending = 1;
	_options.dispatch('app.request', 'start', endpoint, { $element, requestnum, isAjax, abort: ajaxContext.abort });

	return _options.onResponse(function(status, response) {
		const isLast = () => requestnum===_requestnum;
		status===ajax.SUCCESS && _options.dispatch('app.request', 'response', { requestnum, response, isLast: isLast() });

		if (status===ajax.ABORT) {
			_options.dispatch('app.request', 'abort', { requestnum });

			if (_pushing && isLast()) {
				history.cancelState();
			}
		}

		if (status===ajax.ERROR) {
			try { onError(response.error); } catch (e) {}
			try { _options.onError(response.error); } catch (e) {}
		}

		if (status===ajax.ERROR || status===ajax.EMPTY) {
			_options.dispatch('app.request', 'error', { requestnum });

			if (_pushing && isLast()) {
				history.cancelState();
			}
		}

		if (status===ajax.SUCCESS) {
			const nowRequest = (function() { try { return onResponse(response.html, response.json, response.headers); } catch (e) {} })();
		}

		_options.dispatch('app.request', 'end', { requestnum });

		if (isLast()) {
			_pending = 0;
			_pushing = false;
		}
	})
}


function ajaxResponse($element, endpoint, newPage, scrollTo) {
	const [, ...anchor] = endpoint.split('#');
	const foundRequest = _stack.findRequest($element);
	const elementScroll = createElementScroll($element, false, _options.hashFixedEdge);

	return function(text, json, headers) {
		const isCurrent = foundRequest===_stack.loadRequest();

		if (json && json.reload) {
			leave(uri.create());

		} else if (json && json.refresh) {
			if (isCurrent) {
				canonize($element, json.refresh, newPage, scrollTo);

			} else if (foundRequest) {
				foundRequest.willCanonize($element, json.refresh, newPage, scrollTo);
			}

		} else if (json && json.canonize) {
			if (isCurrent) {
				canonize($element, json.canonize, newPage, scrollTo);

			} else if (foundRequest) {
				foundRequest.willCanonize($element, json.canonize, newPage, scrollTo);
			}

		} else if (json && json.redirect) {
			if (isCurrent) {
				redirect($element, json.redirect, newPage, scrollTo);

			} else if (foundRequest) {
				foundRequest.willRedirect($element, json.redirect, newPage, scrollTo);
			}

		} else {
			if (json!==undefined) {
				willUpdate();

				if (json && typeof json==='object') {
					React.transaction(function() {
						Object.keys(json).forEach(key => {
							if (String(key).indexOf('swap[')===0) {
								const swapId = key.substr(5, key.length-6);
								const swapContent = String(json[key]||'');
								const $swapFragment = (isCurrent ? document : request.$fragment);
								const $swapElement = $swapFragment.querySelector('[data-swap="'+swapId+'"]');

								if ($swapElement) {
									React.swapElement($swapElement, swapContent);

								} else if (swapId==='title' || swapId==='document-title') {
									const $title = $swapFragment.querySelector('title');
									$title && ($title.textContent = content);
								}
							}
						});
					});

					update((isCurrent && document) || (foundRequest && foundRequest.$fragment) || $element.ownerDocument, $element, json);
				}

				wasUpdated();

				if (scrollTo) {
					foundRequest.scrolled = scrollTo;

				} else if (isCurrent) {
					elementScroll(false);
				}

			} else if (text && isCurrent) {
				_pushing && history.changeId();
				internalSwap(endpoint, text, anchor.join('#')||scrollTo, false);

			} else if (text && foundRequest) {
				foundRequest.willSwap(endpoint, text, anchor.join('#')||scrollTo, newPage);
			}

			const nowRequest = isCurrent ? _stack.loadRequest() : foundRequest;

			if (nowRequest && headers && headers.link) {
				const canonical = headers.link.match(/<(.+)>; rel="canonical"/i);

				if (canonical) {
					nowRequest.endpoint = uri.canonical(canonical[1]);
				}
			}

			if (isCurrent) {
				if (nowRequest) {
					history.canonical(nowRequest.endpoint, false);
				}

				if (newPage) {
					_options.dispatch('app.request', 'pageview', uri.create());
				}
			}

			return nowRequest;
		}
	}
}


function internalSwap(url, html, scrollTo, isRequestInitial)
{
	const $fragment = createFragment(html);
	const requestInto = _stack.createRequest(_options.createRequest(url, $fragment, scrollTo));

	const $appgineNext = $fragment.querySelector('script[data-appgine]')
	const $appginePrev = document.querySelector('script[data-appgine]');

	if ($appgineNext && $appginePrev && $appgineNext.getAttribute('src')!==$appginePrev.getAttribute('src')) {
		setTimeout(function() {
			Array.from(document.querySelectorAll('script[data-appgine]')).
				forEach($script => $script.parentNode.removeChild($script));

			const $script = document.createElement('script');
			$script.onerror = () => internalSwapRequest(requestInto.initialize(), true, false);
			$script.onload = () => {
				if (typeof window.appgine!=='function') {
					internalSwapRequest(requestInto.initialize(), true, false);

				} else {
					internalDispose();

					const $lastHead = document.createElement('head');
					const $lastBody = document.createElement('body');
					Array.from(document.head.childNodes).filter($child => !($child.hasAttribute && $child.hasAttribute('data-appgine'))).forEach($child => $lastHead.appendChild($child));
					Array.from(document.body.childNodes).forEach($child => $lastBody.appendChild($child));
					Array.from($fragment.querySelector('head').childNodes).forEach($child => document.head.appendChild($child));
					Array.from($fragment.querySelector('body').childNodes).forEach($child => document.body.appendChild($child));
					document.title = loadTitle(document);

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
		internalSwapRequest(requestInto.initialize(), true, isRequestInitial);

		if (scrollTo===0 || scrollTo===false) {
			const $scrollToElement = document.querySelector('[data-scrollTo],[data-scrollToEdge]');

			if ($scrollToElement) {
				requestInto.scrollToElement($scrollToElement);
			}
		}
	}
}


let _internalScrollHash = '';
let _internalRemoveScroll = null;

function internalSwapRequest(requestInto, isRequestNew, isRequestInitial) {
	_internalRemoveScroll && _internalRemoveScroll();
	_options.swap(_request, _request=requestInto, isRequestNew, isRequestInitial);
	internalScrollHash(null, _internalScrollHash, false);

	const $canonical = requestInto.$fragment.querySelector('link[rel="canonical"]');

	if ($canonical) {
		requestInto.endpoint = uri.canonical($canonical.getAttribute('href'));
	}
}


function internalScrollHashToView($origin, hash) {
	const selectorHash = String(hash||'').replace(/["\\]/g, '\\$&');
	$origin = $origin || document.querySelector('a[href="#'+selectorHash+'"]');
	internalScrollHash($origin, hash, true);
}


function internalScrollHash($origin, hash, toView=true, animated=true) {
	_internalScrollHash = hash;
	_internalRemoveScroll && _internalRemoveScroll();

	const $node = hash && document.getElementById(hash);

	if ($node) {
		internalScrollNode($origin, $node, toView, animated);
	}
}


function internalScrollNode($origin, $node, toView=true, animated=true) {
	_options.onBeforeScroll($node);
	_internalRemoveScroll = function() {
		_internalRemoveScroll = null;
		_options.onRemoveScroll($node);
	}

	if (toView) {
		setHashFixedEdge(_options.hashFixedEdge);
		setScrollPosition(_options.nodeScrollPosition);
		scrollNodeToView($origin, $node, animated, () => _internalRemoveScroll && _options.onScroll($node));
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
