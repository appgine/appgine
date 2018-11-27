

export default function(src, timeout, fn) {
	if (typeof timeout!=='function' && timeout) {
		return loadXhr(src, timeout, fn);
	}

	return loadImage(src, fn||timeout);
}


function loadXhr(src, timeout, fn) {
	let progress = 0;

	let xhr = new XMLHttpRequest();
	xhr.onload = onDone;
	xhr.onerror = onDone;
	xhr.onprogress = e => (progress = progress || e.loaded>0 && 1);

	xhr.open('GET', src, true);
	xhr.send();

	function onDone() {
		if (progress!==3) {
			progress = 3;
			xhr = null;
			loadImage(src, fn);
		}
	}

	function abort() {
		if (progress!==3) {
			progress = 3;
			xhr.abort();
			xhr = null;
			fn(0, 0, true);
		}
	}

	if (timeout) {
		setTimeout(function() {
			if (progress===1) {
				progress = 2;
				return setTimeout(abort, timeout/2);
			}

			abort();
		}, timeout);
	}

	return abort;
}


function loadImage(src, fn) {
	const image = new Image();
	image.onload = image.onerror = e => fn(e.target.naturalWidth||0, e.target.naturalHeight||0, false);
	image.src = src;

	return function() {}
}
