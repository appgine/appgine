
goog.module('ajax');

goog.require('uri');

goog.require('goog.events');
goog.require('goog.net.XhrIo');
goog.require('goog.net.EventType');
goog.require('goog.Uri.QueryData');
goog.require('goog.net.Jsonp');

goog.require('goog.dom');
goog.require('goog.dom.forms');
goog.require('goog.array');
goog.require('goog.crypt');


exports.jsonp = function(endpoint, args, fn) {
	(new goog.net.Jsonp(endpoint)).send(args, fn);
};


exports.get = function(endpoint, fn) {
	ajaxRequest(endpoint, 'GET', '', fn);
}


exports.post = function(endpoint, data, fn) {
	ajaxRequest(endpoint, 'POST', data, fn);
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

exports.load = function(endpoint, fn) {
	if (_request) {
		_request.abort();
	}

	bindRequest(_request = new goog.net.XhrIo(), fn);
	_request.send(endpoint, 'GET', '', {
		'X-Requested-With': 'XMLHttpRequest'
	});
}


exports.submit = function($form, $submitter, fn) {
	if (_request) {
		_request.abort();
	}

	var query;
	var data = '';
	var method = ($form.method||'GET').toUpperCase();

	if (method==='POST') {
		data = exports.postData($form, $submitter);

	} else {
		query = exports.queryData($form, $submitter);
	}

	var endpoint = uri.createUri($form.getAttribute('action'), query);
	bindRequest(_request = new goog.net.XhrIo(), fn);
	_request.send(endpoint, method, data, {
		'X-Requested-With': 'XMLHttpRequest'
	});
}


exports.postData = function($form, $submitter) {
	var data = new FormData();
	eachFormData($form, $submitter, function(name, value) {
		data.append(name, value);
	});

	return data;
}


exports.queryData = function($form, $submitter) {
	var query = new goog.Uri.QueryData();
	eachFormData($form, $submitter, function(name, value, isFile) {
		if (!isFile) {
			query.add(name, value);
		}
	});

	return query;
}


function eachFormData($form, $submitter, fn) {
	goog.dom.forms.getFormDataMap($form).forEach(function(value, key) {
		fn(key, value, false);
	});

	var els = $form.elements;
	for (var el, i = 0; el = els[i]; i++) {
		if (el.type.toLowerCase()==='file' && el.files.length) {
			fn(el.name, el.files[0], true);
		}
	}

	if ($submitter && $submitter.name) {
		fn($submitter.name, $submitter.value, false);
	}
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
