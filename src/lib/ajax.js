
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
	timeout = timeout===undefined ? 10e3 : parseInt(timeout, 10);

	function ajaxRequest(request, endpoint, method, data, fn) {
		request.open(method, endpoint, true);

		bindRequest(request, timeout, function(...args) {
			if (localRequest===request) {
				localRequest = null;
			}

			if (globalRequest===request) {
				globalRequest = null;
			}

			if (_globalRequest===request) {
				_globalRequest = null;
			}

			fn(...args);
		});

		for (let key of Object.keys(headers||{})) {
			request.setRequestHeader(key, headers[key]);
		}

		if ((method==='POST' || method==='PUT') && !(data instanceof FormData)) {
			request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
		}

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
	return new XMLHttpRequest();
}
/**
 * @param {XMLHttpRequest}
 * @param {int}
 * @param {function}
 */
function bindRequest(request, timeout, fn)
{
	const nativeAbort = request.abort.bind(request);

	let handled = false;
	function handleResponse(status) {
		if (handled===false) {
			handled = true;

			let code = request.status;
			let headers = parseHeaders(request.getAllResponseHeaders());
			let html = request.responseText;
			let json = handleResponseJson(request.responseText);
			let error = requestError(status, code, html, json);

			status = requestStatus(status, error);
			html = status===SUCCESS ? html : '';
			json = status===SUCCESS ? json : undefined;

			fn(status, { code, headers, error, json, html });
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

			if (code>=500) {
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

	setTimeout(function() {
		if (handled===false) {
			handleResponse(TIMEOUT);
			nativeAbort();
		}
	}, timeout);

	request.onload = handleResponse.bind(null, SUCCESS);
	request.onerror = handleResponse.bind(null, ERROR);

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



/**
 * @param {string}
 * @return {mixed}
 */
function handleResponseJson(text)
{
	try {
		return JSON.parse(text);

	} catch (e) {}

	return undefined;
}
