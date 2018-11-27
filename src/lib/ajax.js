

export const ABORT = 'abort';
export const ERROR = 'error';
export const TIMEOUT = 'timeout';
export const SUCCESS = 'success';


let globalRequest;


export function abort() {
	globalRequest && globalRequest.abort();
}


export function create(headers, timeout) {
	let localRequest;
	let _globalRequest;
	timeout = timeout===undefined ? 10e3 : parseInt(timeout, 10);

	function ajaxRequest(request, endpoint, method, data, fn) {
		request.open(method, endpoint, true);

		bindRequest(request, timeout, fn);

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
			_globalRequest && _globalRequest.abort();
		},
		get(endpoint, fn) {
			localRequest && localRequest.abort();
			localRequest = new XMLHttpRequest();
			ajaxRequest(localRequest, endpoint, 'GET', '', fn);
		},
		post(endpoint, data, fn) {
			localRequest && localRequest.abort();
			localRequest = new XMLHttpRequest();
			ajaxRequest(localRequest, endpoint, 'POST', data, fn);
		},
		load(endpoint, fn) {
			globalRequest && globalRequest.abort();
			_globalRequest = globalRequest = new XMLHttpRequest();
			ajaxRequest(globalRequest, endpoint, 'GET', '', fn);
		},
		submit(endpoint, method, data, fn) {
			globalRequest && globalRequest.abort();
			_globalRequest = globalRequest = new XMLHttpRequest();
			ajaxRequest(globalRequest, endpoint, method, data, fn);
		}
	}
}


export default create();


/**
 * @param {XMLHttpRequest}
 * @param {int}
 * @param {function}
 */
function bindRequest(request, timeout, fn)
{
	let handled = false;
	function handleResponse(status, error) {
		if (handled===false) {
			handled = true;

			fn(status, {
				code: request.status,
				headers: parseHeaders(request.getAllResponseHeaders()),
				error: error,
				json: handleResponseJson(request.responseText),
				html: request.responseText
			});
		}
	}

	setTimeout(function() {
		if (handled===false) {
			handleResponse(TIMEOUT, 'Server did not respond in time.');
			request.abort();
		}
	}, timeout);

	request.onload = function() {
		handleResponse(SUCCESS, null);
	}

	request.onerror = function() {
		if (request.status>=500) {
			handleResponse(ERROR, 'Server responded with unexpected error.');

		} else if (request.status>=400) {
			handleResponse(ERROR, 'Server denied this request.');

		} else {
			handleResponse(ERROR, 'Check your Internet connection.');
		}
	}

	const nativeAbort = request.abort.bind(request);
	request.abort = function() {
		if (handled===false) {
			handleResponse(ABORT, 'Request aborted.');
			nativeAbort();
		}
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
