
goog.module('uri')

goog.require('form');

goog.require('goog.dom');
goog.require('goog.Uri');
goog.require('goog.Uri.QueryData');

var $link = goog.dom.createDom('a');
var $location = goog.dom.createDom('a', {'href': window.location.href});

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

exports.sameOrigin = function(location) {
	return $location.hostname===exports.getPart(location, 'hostname')[0];
}

exports.areSame = function(location1, location2) {
	return ($link.href=location1, $link.href = $link.href)===($link.href=location2, $link.href = $link.href);
}

exports.isSame = function(location) {
	return $location.href===($link.href=location, $link.href = $link.href);
}

exports.create = function(location, params) {
	return exports.createUri(location, params).toString();
}

exports.createFormAction = function($form) {
	var uri;

	if ($form.getAttribute('action')) {
		uri = exports.createUri($form.getAttribute('action'));

	} else {
		uri = exports.createUri();
		uri.setQuery('');
	}

	return uri.toString();
}

exports.createForm = function($form, $submitter) {
	var uri = exports.createUri($form.getAttribute('action'));

	if (String($form.method||'GET').toUpperCase()==='GET') {
		uri.setQueryData(form.queryData($form, $submitter));
	}

	return uri.toString();
}

exports.createReport = function(location, params) {
	$link.href = exports.create(location, params);
	return '/' + $link.pathname.replace(/^\//, '') + $link.search;
}

exports.createUri = function(location, params) {
	if (!location) {
		location = $location.href;
		params = params||{};

	} else if (typeof location === 'object') {
		params = location;
		location = $location.href;

	} else {
		location = location || $location.href;
		params = params||{};
	}

	var uri = new goog.Uri(location);
	var queryData = uri.getQueryData().clone();

	if (params instanceof goog.Uri.QueryData) {
		queryData = params.clone();

	} else {
		queryData.extend(goog.Uri.QueryData.createFromMap(params));
	}

	uri.setQueryData(queryData);
	return uri;
}

exports.isHashLink = function(link) {
	if (link.indexOf('#')===-1) {
		return false;
	}

	var uri = link.split('#', 2)[0];

	if (uri===$location.href) {
		return true;

	} else if ($location.href.indexOf(uri + '#')!==-1) {
		return true;
	}

	return false;
}

exports.getHash = function(link) {
	if (link.indexOf('#')===-1) {
		return '';
	}

	return link.substr(link.indexOf('#')+1);
}
