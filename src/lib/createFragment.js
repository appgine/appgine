
import { dom } from '../closure'

export default function createFragment(htmlString) {
	let $fragment;

	try {
		_createFragment($fragment = _createFragmentElement(), htmlString);

	} catch (e) {
		_createFragmentPartially($fragment = _createFragmentElement(), htmlString);
	}

	return $fragment;
}


function _createFragmentElement() {
	if (navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)) {
		return document.createElement('iframe');

	} else {
		return document.implementation.createHTMLDocument('').createDocumentFragment();
	}
}


function _createFragment($fragment, htmlString) {
	var tempDiv = document.createElement('html');
	  tempDiv.innerHTML = htmlString;

	while (tempDiv.firstChild) {
		$fragment.appendChild(tempDiv.firstChild);
	}
}


function _createFragmentPartially($fragment, htmlString) {
	['head', 'body'].
		map(part => _createFragmentPart(htmlString, part)).
		filter($part => $part).
		forEach($part => $fragment.appendChild($part));
}


function _createFragmentPart(htmlString, part) {
	const pos = htmlString.indexOf('<' + part);
	const end = htmlString.indexOf('</'+part+'>')+3+part.length;

	if (pos>=0) {
		const string = htmlString.substr(pos, end-pos);
		const $part = document.createElement(part);
		const $temp = document.createElement('div');

		$temp.innerHTML = string;
		while ($temp.firstChild) {
			$part.appendChild($temp.firstChild);
		}

		const matched = string.match(/^<[a-z]+([^>]*)>/);
		const $attrs = document.createElement('div');
		$attrs.innerHTML = '<div ' + matched[1] + '></div>';

		const attrs = {};
		Array.from($attrs.children[0].attributes).
			forEach(attr => attrs[attr.name] = attr.value);

		dom.setProperties($part, attrs);
		return $part;
	}
}
