
goog.module('ajax');

goog.require('goog.object');
goog.require('goog.events');
goog.require('goog.net.XhrIo');
goog.require('goog.net.EventType');
goog.require('goog.net.Jsonp');


exports.ABORT = 'abort';
exports.ERROR = 'error';
exports.TIMEOUT = 'timeout';
exports.SUCCESS = 'success';


exports.jsonp = function(endpoint, args, fn) {
	(new goog.net.Jsonp(endpoint)).send(args, fn);
}


var _request;


exports.abort = function() {
	_request && _request.abort();
}


exports.createAjax = function(headers, timeout) {

	function ajaxRequest(endpoint, method, data, fn) {
		var request = new goog.net.XhrIo();

		bindRequest(request, fn);
		request.setTimeoutInterval(timeout===undefined ? 10e3 : parseInt(timeout, 10));
		request.send(endpoint, method, data, Object.assign({}, headers, {
			'X-Requested-With': 'XMLHttpRequest',
			'Is-Ajax': 1
		}));
	}


	function pageRequest(endpoint, method, data, fn) {
		_request && _request.abort();
		bindRequest(_request = new goog.net.XhrIo(), fn);
		_request.setTimeoutInterval(timeout===undefined ? 10e3 : parseInt(timeout, 10));
		_request.send(endpoint, method, data, Object.assign({}, headers, {
			'X-Requested-With': 'XMLHttpRequest'
		}));
	}

	return {
		"get": function(endpoint, fn) {
			ajaxRequest(endpoint, 'GET', '', fn);
		},
		"post": function(endpoint, data, fn) {
			ajaxRequest(endpoint, 'POST', data, fn);
		},
		"load": function(endpoint, fn) {
			pageRequest(endpoint, 'GET', '', fn);
		},
		"submit": function(endpoint, method, data, fn) {
			pageRequest(endpoint, method, data, fn);
		}
	}
}


var ajax = exports.createAjax();
exports.get = ajax.get;
exports.post = ajax.post;
exports.load = ajax.load;
exports.submit = ajax.submit;


/**
 * @param {goog.net.XhrIo}
 * @param {function}
 */
function bindRequest(request, fn)
{
	var handled = false;
	var handleResponse = function(e, status, error) {
		if (handled===false) {
			handled = true;

			var response = {};
			response['headers'] = e.target.getAllResponseHeaders();
			response['error'] = error;
			response['json'] = handleResponseJson(e.target);
			response['html'] = e.target.getResponseText();

			fn(status, response);
		}
	}

	goog.events.listen(request, goog.net.EventType.SUCCESS, function(e) {
		handleResponse(e, exports.SUCCESS, null);
	});

	goog.events.listen(request, goog.net.EventType.TIMEOUT, function(e) {
		handleResponse(e, exports.TIMEOUT, 'Server did not respond in time.');
	});

	goog.events.listen(request, goog.net.EventType.ABORT, function(e) {
		handleResponse(e, exports.ABORT, 'Request aborted.');
	});

	goog.events.listen(request, goog.net.EventType.ERROR, function(e) {
		if (e.target.getStatus()>=500) {
			handleResponse(e, exports.ERROR, 'Server responded with unexpected error.');

		} else if (e.target.getStatus()>=400) {
			handleResponse(e, exports.ERROR, 'Server denied this request.');

		} else {
			handleResponse(e, exports.ERROR, 'Check your Internet connection.');
		}
	});
}


/**
 * @param {mixed}
 * @return {mixed}
 */
function handleResponseJson(target)
{
	try {
		return target.getResponseJson();

	} catch (e) {
		return undefined;
	}
}
