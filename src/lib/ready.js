

let readyFn = [];
const whenReady = function() {
	document.removeEventListener("DOMContentLoaded", whenReady);
	window.removeEventListener("load", whenReady);

	const _readyFn = readyFn;
	readyFn = null;
	_readyFn.forEach(fn => fn());
}

export default function ready(fn) {
	if (readyFn===null) {
		return fn();
	}

	if (readyFn.push(fn)===1) {
		document.addEventListener("DOMContentLoaded", whenReady);
		window.addEventListener("load", whenReady);

		if (document.readyState === "complete" ||
			(document.readyState !== "loading" && !document.documentElement.doScroll)) {
			whenReady();
		}
	}
}
