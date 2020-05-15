

export default function querySelectorAll($dom, selector) {
	return [].concat(matchesSelector($dom, selector) ? $dom : [], Array.from($dom.querySelectorAll(selector)));
}

const matchesSelector = (function() {
	const p = Element.prototype;
	const f = p.matches || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || function(selector) {
		return [].indexOf.call(document.querySelectorAll(selector), this) !== -1;
	};

	return function($dom, selector) {
		return $dom instanceof Element ? f.call($dom, selector) : false;
	}
})();
