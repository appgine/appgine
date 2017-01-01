
goog.module('ajax');

goog.require('goog.events');
goog.require('goog.net.XhrIo');
goog.require('goog.net.EventType');
goog.require('goog.net.Jsonp');


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


function ajaxRequest(endpoint, method, data, fn) {
	var request = new goog.net.XhrIo();

	bindRequest(request, fn);
	request.send(endpoint, method, data, {
		'X-Requested-With': 'XMLHttpRequest',
		'Is-Ajax': 1
	});
}


var _request;
function pageRequest(endpoint, method, data, fn) {
	_request && _request.abort();

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
	request.setTimeoutInterval(10000);

	goog.events.listen(request, goog.net.EventType.SUCCESS, function(e) {
		handleResponse(e, null, fn);
	});

	goog.events.listen(request, goog.net.EventType.TIMEOUT, function(e) {
		handleResponse(e, 'Server did not respond in time.', fn);
	});

	goog.events.listen(request, goog.net.EventType.ERROR, function(e) {

		var error;
		if (e.target.getStatus()>=500) {
			error = 'Server responded with unexpected error.';

		} else if (e.target.getStatus()>=400) {
			error = 'Server denied this request.';

		} else {
			error = 'Check your Internet connection.';
		}

		handleResponse(e, error, fn);
	});
}


/**
 * @param {Event}
 * @param {string}
 * @param {function}
 */
function handleResponse(event, err, fn)
{
	event.target.getAllResponseHeaders();

	fn(
		err,
		handleResponseText(event.target.getResponseText()),
		handleResponseJson(event.target)
	);
}


/**
 * @param {string}
 * @return {string}
 */
function handleResponseText(text)
{
	return text;
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
