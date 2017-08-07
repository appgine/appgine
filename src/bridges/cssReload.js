
import { md5, browser } from '../closure'


function defaultTransform(href) {
	return transformWithSearch(href, process.env.NODE_ENV!=='development');
}

const $helper = document.createElement('a');
function transformWithSearch(href, search) {
	$helper.href = href;

	return [
		$helper.protocol,
		'//',
		$helper.hostname,
		$helper.pathname || '/',
		search ? ('?'+$helper.search) : '',
	].join('');
}

let loaded = null;
let loading = [];
let styles = [];
let swaplist = [];
let pending = null;

export default function bridgeCssReload(options={}, transform=defaultTransform) {
	const { onBeforeSwap } = options;

	options.onBeforeSwap = function(requestFrom, requestTo) {
		if (loaded===null) {
			loaded = [];

			Array.from(document.head.querySelectorAll('link[rel*=stylesheet]')).forEach(function($link) {
				const cssid = buildLinkMD5($link, transform($link.getAttribute('href')))
				const swapid = buildLinkMD5($link, transformWithSearch($link.getAttribute('href'), false))
				loaded.push({ $link, cssid, swapid });
			});
		}

		onBeforeSwap && onBeforeSwap(...arguments);
		const { $fragment } = requestTo;

		let _styles = [];
		Array.from($fragment.querySelectorAll('head > style')).forEach(function($style) {
			const _$style = $style.cloneNode(true);
			_styles.push(_$style);
			document.head.appendChild(_$style);
		});

		styles.forEach($style => $style.parentNode && $style.parentNode.removeChild($style));
		styles = _styles;

		let enabled = [];
		let swapped = [];
		Array.from($fragment.querySelectorAll('link[rel*=stylesheet]')).forEach(function($link) {
			if (transform($link.getAttribute('href'))) {
				const cssid = buildLinkMD5($link, transform($link.getAttribute('href')));
				const swapid = buildLinkMD5($link, transformWithSearch($link.getAttribute('href'), false));

				let exists = null;
				let swap = null;

				[].concat(loaded, loading).forEach(function(item) {
					if (item.cssid===cssid) {
						exists = item;
					}
				});

				loaded.forEach(function(item) {
					if (item.swapid===swapid && !item.$link.disabled) {
						swap = item;
					}
				});

				if (exists===null) {
					exists = {$link: createCssElement($link), cssid, swapid};
					loading.push(exists);

					addLoadedHandlers(exists, function(item) {
						swaplist = swaplist.filter(([swap1, swap2]) => {
							if (swap1===item) {
								swap2.$link.disabled = true;
								return false;
							}

							return true;
						});
					});

					document.head.appendChild(exists.$link);
				}

				if (swap && swap!==exists && loading.indexOf(exists)!==-1) {
					swapped.push(swap);
					swaplist.push([exists, swap]);
				}

				$link.disabled = true;
				exists.$link.disabled = false;
				enabled.push(exists);
			}
		});

		[].concat(loaded, loading).forEach(function(item) {
			if (enabled.indexOf(item)===-1 && swapped.indexOf(item)===-1) {
				item.$link.disabled = true;
			}
		});

		swaplist = swaplist.filter(([swap1, swap2]) => !swap1.$link.disabled && !swap2.$link.disabled && enabled.indexOf(swap2)===-1);

		clearTimeout(pending);
		pending = setTimeout(loadCssStylesheet, 10);
	}

	return options;
}


function buildLinkMD5($link, href) {
	let html = $link.outerHTML;

	html = html.replace($link.getAttribute('href'), href);
	html = html.replace(/disabled=[^>\s]*/, '');
	html = html.replace(/\s/g, '');

	return md5(html);
}


function createCssElement($link) {
	if (browser.isFirefox()) {
		const $style = document.createElement('style');
		$style.textContent = '@import "' + $link.href + '"';

		for (let attr of $link.attributes) {
			$style.setAttribute(attr.name, attr.value);
		}

		return $style;
	}

	return $link.cloneNode(true);
}


function addLoadedHandlers(item, cb) {
	const { $link } = item;

	let done = false;
	function onDone(e) {
		if (!browser.isFirefox() || e===true) {
			$link.onload = null;
			$link.onreadystatechange = null;

			if ($link.removeEventListener) {
				$link.removeEventListener('load', onDone);
			}

			if (done===false) {
				done = true;
				cb(item);
			}
		}
	}

	$link.onload = onDone;

	$link.onreadystatechange = function() {
		const state = $link.readyState;
		if (state === 'loaded' || state === 'complete') {
			onDone(true);
		}
	};

	if ($link.addEventListener) {
		$link.addEventListener('load', onDone);
	}
}


function loadCssStylesheet() {
	for (let item of loading) {
		const { $link } = item;

		if ($link.tagName==='style') {
			try {
				$link.sheet.cssRules; // see: https://www.phpied.com/when-is-a-stylesheet-really-loaded/
				loading.splice(loading.indexOf(item), 1);
				loaded.push(item);
			    $link.onload && $link.onload(true);

			} catch (e) {}

		} else {
			for (let sheet of document.styleSheets) {
				if (sheet.ownerNode===$link) {
					loading.splice(loading.indexOf(item), 1);
					loaded.push(item);
					$link.onload && $link.onload(true);
				}
			}
		}
	}

	if (loading.length) {
		pending = setTimeout(loadCssStylesheet, 10);
	}
}
