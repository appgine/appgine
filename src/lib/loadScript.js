

const loading = {};

export default function loadScript(src, onLoad) {
	if (loading[src]===true) {
		return onLoad && onLoad(false);

	} else if (loading[src]===false) {
		return null;

	} else if (loading[src]===undefined) {
		loading[src] = [onLoad];

		const $script = document.createElement('script');
		$script.async = 1;
		$script.onload = function() {
			const callbacks = loading[src];
			const first = callbacks.shift();

			loading[src] = true;
			first && first(true);
			callbacks.forEach(fn => fn && fn(false));
		}
		$script.onerror = function() {
			loading[src] = false;
		}
		$script.src = src;

		while (!(document.querySelector('head') || document.documentElement).appendChild);
		(document.querySelector('head') || document.documentElement).appendChild($script);

	} else {
		loading[src].push(onLoad);
	}
}
