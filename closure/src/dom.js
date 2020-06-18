
goog.module('dom');

goog.require('uri');
goog.require('goog.dom');
goog.require('goog.array');
goog.require('goog.crypt');
goog.require('goog.crypt.Md5');



exports.setTextContent = goog.dom.setTextContent;
exports.setProperties = goog.dom.setProperties;
exports.createDom = goog.dom.createDom;
exports.getChildren = goog.dom.getChildren;
exports.findNodes = goog.dom.findNodes;
exports.removeChildren = goog.dom.removeChildren;
exports.contains = function(parent, descendant) {
	return parent && descendant ? goog.dom.contains(parent, descendant) : false;
};

exports.compareNodeOrder = goog.dom.compareNodeOrder;
exports.append = goog.dom.append;
exports.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
exports.getNextElementSibling = goog.dom.getNextElementSibling;
exports.getLink = function(target) {
	return exports.getAncestor(target, 'a');
}

exports.getAncestor = function(target, matcher) {
	if (goog.isFunction(matcher)===false) {
		var args = goog.array.map([].slice.call(arguments, 1), function(tagName) { return tagName.toUpperCase(); });
		matcher = function(node) { return args.indexOf(node.nodeName)!==-1; };
	}

	var $target = target.target||target;
	while ($target) {
		if (matcher($target)) {
			return $target;
		}

		if ($target.nodeType===11) { // shadow-root
			$target = $target.parentNode || $target.host;

		} else {
			$target = $target.parentNode;
		}
	}

	return null;
}

exports.getSubmitter = function($form, target) {
	var $submitter = exports.getAncestor(target, function($node) {
		return String($node.type||'').toLowerCase()==='submit';
	});

	if (!$form) {
		return $submitter;

	} else if ($submitter && $submitter.form===$form) {
		return $submitter;
	}

	return null;
}

exports.isFormTag = function($element) {
	if (!$element) {
		return false;
	}

	var tagName = String($element.tagName).toLowerCase();

	if (tagName==='input') {
		return true;

	} else if (tagName==='button') {
		return true;

	} else if (tagName==='textarea') {
		return true;

	} else if (tagName==='select') {
		return true;
	}

	return false;
}

exports.isFormElement = function($element) {
	return exports.isFormTag($element) && $element.name && $element.form;
}

exports.shouldHaveFormId = function($form) {
	for (var i=0; i<$form.elements.length; i++) {
		var $element = $form.elements[i];
		var tagName = String($element.tagName).toLowerCase();
		var type = String($element.type||'').toLowerCase();

		if (tagName==='button') {
			continue;

		} else if (type==='hidden' || type==='submit') {
			continue;
		}

		return true;
	}

	return false;
}

var md5;
exports.createFormId = function($form) {
	var names = [
		uri.createFormAction($form),
		String($form.method||'GET'),
		String($form.name||'')
	];

	for (var i=0; i<$form.elements.length; i++) {
		var $element = $form.elements[i];
		var elName = String($element.name||'');

		if (names.indexOf(elName)===-1 && elName) {
			names.push(elName);
		}
	}

	names.sort();

	md5 = md5 || new goog.crypt.Md5();
	md5.reset();
	md5.update(names.join('\n'));
	return goog.crypt.byteArrayToHex(md5.digest());
}


exports.findForm = function(formName, formId) {
	if (formName) {
		return document.forms[formName]

	} else if (formId) {
		for (var i=0; i<document.forms.length; i++) {
			if (formId===exports.createFormId(document.forms[i])) {
				return document.forms[i];
			}
		}
	}
}
