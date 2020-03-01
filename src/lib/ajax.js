
import { locale } from '../locale'


export const ABORT = 'abort';
export const ERROR = 'error';
export const TIMEOUT = 'timeout';
export const SUCCESS = 'success';


let _globalRequest;


export function abort() {
	_globalRequest && _globalRequest.abort();
}


export function create(headers, timeout) {
	let localRequest;
	let globalRequest;
	timeout = timeout===undefined ? 30e3 : parseInt(timeout, 10);

	function ajaxRequest(request, endpoint, method, data, fn) {
		request.open(method, endpoint, true);

		bindRequest(endpoint, request, timeout, function(...args) {
			if (localRequest===request) {
				localRequest = null;
			}

			if (globalRequest===request) {
				globalRequest = null;
			}

			if (_globalRequest===request) {
				_globalRequest = null;
			}

			fn && fn(...args);
		});

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
		request.send(data);
	}


	return {
		abort() {
			localRequest && localRequest.abort();
			localRequest = null;
			globalRequest && globalRequest.abort();
			globalRequest = null;
		},
		canAbort() {
			return !!(localRequest || globalRequest);
		},
		get(endpoint, fn) {
			localRequest && localRequest.abort();
			localRequest = createRequest();
			ajaxRequest(localRequest, endpoint, 'GET', null, fn);
		},
		post(endpoint, data, fn) {
			localRequest && localRequest.abort();
			localRequest = createRequest();
			ajaxRequest(localRequest, endpoint, 'POST', data, fn);
		},
		load(endpoint, fn) {
			_globalRequest && _globalRequest.abort();
			globalRequest = _globalRequest = createRequest();
			ajaxRequest(globalRequest, endpoint, 'GET', null, fn);
		},
		submit(endpoint, method, data, fn) {
			_globalRequest && _globalRequest.abort();
			globalRequest = _globalRequest = createRequest();
			ajaxRequest(globalRequest, endpoint, method, data, fn);
		}
	}
}


export default create();


function createRequest()
{
	const controller = window.TextDecoder && window.AbortController && new window.AbortController();

	if (!controller || !controller.signal || !controller.abort) {
		const xhrrequest = new XMLHttpRequest();
		xhrrequest.onerror = e => xhrrequest.error && xhrrequest.error('xhr');
		xhrrequest.onload = e => xhrrequest.done && xhrrequest.done();

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
		onerror: null,
		onload: null,
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
 * @param {XMLHttpRequest}
 * @param {int}
 * @param {function}
 */
function bindRequest(endpoint, request, timeout, onresponse)
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

			status = requestStatus(status, error);
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

	function requestStatus(status, error) {
		if (status===TIMEOUT || status===ABORT) {
			return status;

		} else if (error) {
			return ERROR;
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
