
goog.module('ajax');

goog.require('goog.events');
goog.require('goog.net.XhrIo');
goog.require('goog.net.EventType');
goog.require('goog.net.Jsonp');

var _request;
var _timeout = 10e3;

exports.ABORT = 'abort';
exports.ERROR = 'error';
exports.TIMEOUT = 'timeout';
exports.SUCCESS = 'success';

exports.setTimeout = function(timeout) {
	_timeout = parseInt(timeout, 10);
}

exports.jsonp = function(endpoint, args, fn) {
	(new goog.net.Jsonp(endpoint)).send(args, fn);
};


exports.get = function(endpoint, fn) {
	ajaxRequest(endpoint, 'GET', '', fn);
}


exports.post = function(endpoint, data, fn) {
	ajaxRequest(endpoint, 'POST', data, fn);
}


exports.load = function(endpoint, fn) {
	pageRequest(endpoint, 'GET', '', fn);
}


exports.submit = function(endpoint, method, data, fn) {
	pageRequest(endpoint, method, data, fn);
}


exports.abort = function() {
	_request && _request.abort();
}


function ajaxRequest(endpoint, method, data, fn) {
	var request = new goog.net.XhrIo();

	bindRequest(request, fn);
	request.send(endpoint, method, data, {
		'X-Requested-With': 'XMLHttpRequest',
		'Is-Ajax': 1
	});
}


function pageRequest(endpoint, method, data, fn) {
	exports.abort();

	bindRequest(_request = new goog.net.XhrIo(), fn);
	_request.send(endpoint, method, data, {
		'X-Requested-With': 'XMLHttpRequest'
	});
}


/**
 * @param {goog.net.XhrIo}
 * @param {function}
 */
function bindRequest(request, fn)
{
	request.setTimeoutInterval(_timeout);

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
