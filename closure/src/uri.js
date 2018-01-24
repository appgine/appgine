
goog.module('uri')

goog.require('form');

goog.require('goog.dom');
goog.require('goog.Uri');
goog.require('goog.Uri.QueryData');

goog.Uri.reDisallowedInFragment_ = /^$/;

var $link = goog.dom.createDom('a');
var $location = goog.dom.createDom('a', {'href': window.location.href});
var _ignoreURIParams = [];

exports.ignoreURIParams = function(ignoreURIParams) {
	_ignoreURIParams = ignoreURIParams;
}

exports.change = function(location) {
	$location.href = location;
	// Fix: IE bug with relative location
	$location.href = $location.href;
	return exports.create();
}

exports.getPart = function(location, part) {
	$link.href = location;
	// Fix: IE bug with relative location
	$link.href = $link.href;
	return goog.array.map([].slice.call(arguments, 1), function(part) {
		return $link[part]||'';
	});
}

exports.getQueryKeys = function(location) {
	var uri = createUri(location);
	return uri.getQueryData().getKeys();
}

exports.sameOrigin = function(location) {
	return $location.hostname===exports.getPart(location, 'hostname')[0];
}

exports.areSame = function(location1, location2) {
	return ($link.href=location1, $link.href = $link.href)===($link.href=location2, $link.href = $link.href);
}

exports.isSame = function(location) {
	return $location.href===($link.href=location, $link.href = $link.href);
}

exports.create = function(location, params, hash) {
	return createUri(location, params, hash).toString();
}

exports.createFormAction = function($form) {
	return createUri($form.getAttribute('action'), !form.isMethod($form, 'GET'), $form.getAttribute('action') ? undefined : '').toString();
}

exports.createForm = function($form, $submitter) {
	var createdUri = createUri(exports.createFormAction($form));

	if (form.isMethod($form, 'GET')) {
		createdUri.setQueryData(form.queryData($form, $submitter));
	}

	return createdUri.toString();
}

exports.createReport = function(location, params) {
	$link.href = exports.create(location, params);
	return '/' + $link.pathname.replace(/^\//, '') + $link.search;
}


/**
 * @param {string}
 * @param {object}
 * @param {string}
 * @return {goog.Uri}
 */
function createUri(location, params, hash) {
	if (location && typeof location === 'object') {
		params = location;
		location = $location.href;

	} else {
		location = location || $location.href;
	}

	var uri = new goog.Uri(location);
	var queryData = uri.getQueryData().clone();

	if (params===false) {
		queryData.clear();

	} else if (params instanceof goog.Uri.QueryData) {
		queryData = params.clone();

	} else if (typeof params === 'object') {
		queryData.extend(goog.Uri.QueryData.createFromMap(params||{}));
	}

	if (typeof _ignoreURIParams==='string') {
		queryData.remove(_ignoreURIParams);

	} else if (goog.isArray(_ignoreURIParams)) {
		_ignoreURIParams.forEach(function(key) {
			queryData.remove(key);
		});
	}

	uri.setQueryData(queryData);

	if (typeof hash==='string') {
		uri.setFragment(hash);

	} else if (hash===true) {
		uri.setFragment($location.hash.substr(1));
	}

	return uri;
}
