
goog.module('form');

goog.require('goog.Uri.QueryData');
goog.require('goog.dom');
goog.require('goog.dom.forms');


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
