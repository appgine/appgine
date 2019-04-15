
import { dom } from '../closure'


export default function createFragment(htmlString) {
	const $fragment = _createFragmentElement();

	try {
		_createFragment($fragment, htmlString);

	} catch (e) {
		_createFragmentPartially($fragment, htmlString);
	}

	Array.from($fragment.querySelectorAll('script')).forEach(function($script) {
		$script.textContent = String($script.textContent).replace('__END_SCRIPT_TAG__', '<');
	});

	const matched = htmlString.match(/<html\s+([^>]+)>/);

	if (matched) {
		copyAttributes($fragment, matched[1]);
	}

	return $fragment;
}


function _createFragmentElement() {
	return document.createElement('iframe');
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


function copyAttributes($element, attrs) {
	try {
		if ($element.setAttribute) {
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = '<div '+ attrs +'></div>';

			for (let attr of Array.from(tempDiv.firstChild.attributes)) {
				$element.setAttribute(attr.name, attr.value);
			}
		}

	} catch (e) {}
}
