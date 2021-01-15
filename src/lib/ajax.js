
import { locale } from '../locale'
import * as errorhub from '../errorhub'


export const ABORT = 'abort';
export const ERROR = 'error';
export const EMPTY = 'empty';
export const TIMEOUT = 'timeout';
export const SUCCESS = 'success';


const _globalRequest = {};


export function abort() {
	_globalRequest[null] && _globalRequest[null].current && _globalRequest[null].current.abort();
}


export function create(headers, timeout, name=null) {
	let localRequest = null;
	let globalRequest = _globalRequest[name] = _globalRequest[name] || {current: null};
	timeout = timeout===undefined ? 30e3 : parseInt(timeout, 10);

	function ajaxRequest(request, endpoint, method, data, fn, fnprogress) {
		request.open(method, endpoint, true);

		function fndone(...args) {
			if (localRequest===request) {
				localRequest = null;
			}

			if (globalRequest.current===request) {
				globalRequest.current = null;
			}

			if (_globalRequest[null].current===request) {
				_globalRequest[null].current = null;
			}

			fn && fn(...args);
			fn = null;
		}

		for (let key of Object.keys(headers||{})) {
			request.setRequestHeader(key, headers[key]);
		}

		if ((method==='POST' || method==='PUT') && !(data instanceof FormData)) {
			request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
		}

		request.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
		request.setRequestHeader('Pragma', 'no-cache');
		request.setRequestHeader('Expires', '0');
		request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

		bindRequest(endpoint, request, timeout, fndone, fnprogress);
		request.send(data);
	}

	let aborted = false;
	function checkPendingAbort(onResponse, onCreate) {
		if (aborted===true) {
			aborted = false;
			const error = locale.error.request.abort;
			return onResponse(ABORT, { code: 0, headers: {}, error, json: undefined, html: '' });
		}

		return onCreate();
	}

	return {
		abort() {
			aborted = aborted || localRequest!==null;
			localRequest && localRequest.abort();
			localRequest = null;
		},
		canAbort() {
			return !!localRequest;
		},
		get(endpoint, fn) {
			checkPendingAbort(fn, function() {
				localRequest && localRequest.abort();
				localRequest = createRequest(false);
				ajaxRequest(localRequest, endpoint, 'GET', null, fn);
			})
		},
		post(endpoint, data, fn, fnprogress) {
			checkPendingAbort(fn, function() {
				localRequest && localRequest.abort();
				localRequest = createRequest(!!fnprogress);
				ajaxRequest(localRequest, endpoint, 'POST', data, fn, fnprogress);
			})
		},
		load(endpoint, fn) {
			checkPendingAbort(fn, function() {
				globalRequest.current && globalRequest.current.abort();
				globalRequest.current = createRequest(false);
				ajaxRequest(globalRequest.current, endpoint, 'GET', null, fn);
			})
		},
		submit(endpoint, method, data, fn, fnprogress) {
			checkPendingAbort(fn, function() {
				globalRequest.current && globalRequest.current.abort();
				globalRequest.current = createRequest(!!fnprogress);
				ajaxRequest(globalRequest.current, endpoint, method, data, fn, fnprogress);
			})
		}
	}
}


export default create();


function createRequestController() {
	if (typeof Response === 'undefined') {
		return null;

	} else if (Response.prototype.hasOwnProperty("body")===false) {
		return null;
	}

	const controller = window.TextDecoder && window.AbortController && new window.AbortController();

	if (controller && controller.signal && controller.abort) {
		return controller;
	}

	return null;
}


function createRequest(needsProgress)
{
	const controller = createRequestController();

	if (needsProgress || controller===null) {
		const xhrrequest = new XMLHttpRequest();
		xhrrequest.onerror = e => xhrrequest.error && xhrrequest.error('xhr');
		xhrrequest.onload = e => xhrrequest.done && xhrrequest.done();

		if (xhrrequest.upload) {
			xhrrequest.upload.onprogress = e => xhrrequest.progress && xhrrequest.progress(e.loaded, e.total);
		}

		return xhrrequest;
	}

	const headers = new Headers();

	const options = {
		endpoint: null,
		method: 'GET',
		signal: controller.signal,
		headers: headers,
		cache: 'no-cache',
		body: null,
	}

	const responseHeaders = {};
	let responseText = '';

	const request = {
		setRequestHeader(name, value) {
			headers.append(name, value);
		},
		abort() {
			controller.abort();
		},
		open(method, endpoint, async) {
			options.endpoint = endpoint;
			options.method = method;
		},
		getAllResponseHeaders() {
			return responseHeaders;
		},
		status: 0,
		responseText: '',
		send(data) {
			const endpoint = options.endpoint;

			delete options.endpoint;
			options.body = data;

			window.fetch(endpoint, options).then(response => {
				request.status = response.status;

				for (let header of response.headers) {
					responseHeaders[header[0]] = header[1];
				}

				const reader = response.body.getReader();
				let loaded = false;

				function read() {
					reader.read().then(({ done, value }) => {
						if (value) {
							responseText += new TextDecoder('utf-8').decode(value);
							responseText = responseText.replace(/^\s+/, '');
						}

						if (done) {
							request.responseText = responseText;
							request.done && request.done();

						} else {
							read();
						}

					}).catch(function(error) {
						request.error && request.error('reader', error);
					});
				}

				read();
			}).catch(function(error) {
				request.error && request.error('fetch', error);
			});
		},
	}

	return request;
}


/**
 * @param {string}
 * @param {XMLHttpRequest}
 * @param {int}
 * @param {function}
 * @param {function}
 */
function bindRequest(endpoint, request, timeout, onresponse, onprogress)
{
	const nativeAbort = request.abort.bind(request);

	let handling = setTimeout(function() {
		handleResponse(TIMEOUT);
		nativeAbort();
	}, timeout);

	function handleResponse(status, ...args) {
		if (handling) {
			clearTimeout(handling);
			handling = null;

			let code = request.status;
			let headers = parseHeaders(request.getAllResponseHeaders());
			let html = request.responseText;
			let json = (function() { try { return JSON.parse(request.responseText); } catch(e) {} return undefined; })();
			let error = requestError(status, code, html, json);

			if (error && status!==ABORT) {
				errorhub.dispatch(errorhub.ERROR.AJAX, error, new Error(error), endpoint, code, headers, json, html, args);
			}

			status = requestStatus(status, error, json, html);
			html = status===SUCCESS ? html : '';
			json = status===SUCCESS ? json : undefined;

			const response = { code, headers, error, json, html };

			onresponse && onresponse(status, response);
		}
	}

	function requestError(status, code, html, json) {
		if (status===TIMEOUT) {
			return locale.error.request.timeout;

		} else if (status===ABORT) {
			return locale.error.request.abort;

		} else if (code>=400) {
			if ((typeof json==='object') && json && json.error===undefined) {
				return null;
			}

			if (code===503) {
				return locale.error.request.status503;

			} else if (code>=500) {
				return locale.error.request.status500;
			}

			return locale.error.request.status400;

		} else if (status===ERROR) {
			return locale.error.request.nointernet;

		} else if (!html && json===undefined) {
			return locale.error.request.empty;
		}

		return null;
	}

	function requestStatus(status, error, json, html) {
		if (status===TIMEOUT || status===ABORT) {
			return status;

		} else if (error) {
			return ERROR;

		} else if (!html && json===undefined) {
			return EMPTY;
		}

		return SUCCESS;
	}

	request.done = function() {
		request.done = null;
		request.error = null;
		handleResponse(SUCCESS);
	};

	request.error = function() {
		request.done = null;
		request.error = null;
		handleResponse(ERROR, ...arguments)
	};

	request.progress = function(loaded, total) {
		if (handling) {
			clearTimeout(handling);
			handling = setTimeout(function() {
				handleResponse(TIMEOUT);
				nativeAbort();
			}, timeout);
		}

		onprogress && onprogress(loaded, total);
	};

	request.abort = function() {
		handleResponse(ABORT);
		nativeAbort();
	}
}


/**
 * @param {string}
 * @return {object}
 */
function parseHeaders(headers)
{
	if (typeof headers==='object') {
		return headers || {};
	}

	const headersObject = {};
	const headersArray = headers.split('\r\n');

	for (let i=0; i < headersArray.length; i++) {
		let [key, value] = String(headersArray[i]).split(': ', 2);

		if (value) {
			key = key.toLowerCase();

			if (headersObject[key]) {
				headersObject[key] += ', ' + value;
			} else {
				headersObject[key] = value;
			}
		}
	}

	return headersObject;
}
