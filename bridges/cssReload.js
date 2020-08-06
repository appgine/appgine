
import { crc32, browser } from 'appgine/closure'


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

window.appgineCssReload = window.appgineCssReload || {
	loaded: null,
	loading: [],
	styles: [],
	swaplist: [],
	pending: null,
}


export default function bridgeCssReload(options={}, transform=defaultTransform) {
	const { onBeforeSwap } = options;

	options.onBeforeSwap = function(requestFrom, requestTo) {

		if (window.appgineCssReload.loaded===null) {
			window.appgineCssReload.loaded = [];

			Array.from(document.head.querySelectorAll('link[rel*=stylesheet]')).forEach(function($link) {
				const cssid = buildLinkHash($link, transform($link.getAttribute('href')))
				const swapid = buildLinkHash($link, transformWithSearch($link.getAttribute('href'), false))
				$link.setAttribute('data-appgine', '');
				window.appgineCssReload.loaded.push({ $link, cssid, swapid });
			});

			Array.from(document.head.querySelectorAll('style')).forEach(function($style) {
				if ($style.hasAttribute('data-appgine')===false) {
					$style.setAttribute('data-appgine', '');
					window.appgineCssReload.styles.push($style);
				}
			});

		} else {
			Array.from(document.head.querySelectorAll('style')).forEach(function($style) {
				if ($style.hasAttribute('data-appgine')===false) {
					$style.parentNode.removeChild($style);
				}
			});
		}

		onBeforeSwap && onBeforeSwap(...arguments);
		const { $fragment } = requestTo;

		let _styles = [];
		Array.from($fragment.querySelectorAll('head > style')).forEach(function($style) {
			if ($style.hasAttribute('data-appgine')===false) {
				const _$style = $style.cloneNode(true);
				_styles.push(_$style);
				document.head.appendChild(_$style);
			}
		});

		window.appgineCssReload.styles.forEach($style => $style.parentNode && $style.parentNode.removeChild($style));
		window.appgineCssReload.styles = _styles;

		let enabled = [];
		let swapped = [];
		Array.from($fragment.querySelectorAll('link[rel*=stylesheet]')).forEach(function($link) {
			if ($link.hasAttribute('data-appgine')===false && transform($link.getAttribute('href'))) {
				const cssid = buildLinkHash($link, transform($link.getAttribute('href')));
				const swapid = buildLinkHash($link, transformWithSearch($link.getAttribute('href'), false));

				let exists = null;
				let swap = null;

				[].concat(window.appgineCssReload.loaded, window.appgineCssReload.loading).forEach(function(item) {
					if (item.cssid===cssid) {
						exists = item;
					}
				});

				window.appgineCssReload.loaded.forEach(function(item) {
					if (item.swapid===swapid && !item.$link.disabled) {
						swap = item;
					}
				});

				if (exists===null) {
					exists = {$link: createCssElement($link), cssid, swapid};
					window.appgineCssReload.loading.push(exists);

					addLoadedHandlers(exists, function(item) {
						window.appgineCssReload.swaplist = window.appgineCssReload.swaplist.filter(([swap1, swap2]) => {
							if (swap1===item) {
								swap2.$link.disabled = true;
								return false;
							}

							return true;
						});
					});

					insertStyleLink(exists.$link);
				}

				if (swap && swap!==exists && window.appgineCssReload.loading.indexOf(exists)!==-1) {
					swapped.push(swap);
					window.appgineCssReload.swaplist.push([exists, swap]);
				}

				$link.disabled = true;
				exists.$link.disabled = false;
				enabled.push(exists);
			}
		});

		[].concat(window.appgineCssReload.loaded, window.appgineCssReload.loading).forEach(function(item) {
			if (enabled.indexOf(item)===-1 && swapped.indexOf(item)===-1) {
				item.$link.disabled = true;
			}
		});

		window.appgineCssReload.swaplist = window.appgineCssReload.swaplist.filter(([swap1, swap2]) => !swap1.$link.disabled && !swap2.$link.disabled && enabled.indexOf(swap2)===-1);

		clearTimeout(window.appgineCssReload.pending);

		if (window.appgineCssReload.loading.length) {
			window.appgineCssReload.pending = setTimeout(loadCssStylesheet, 10);
		}
	}

	return options;
}


function buildLinkHash($link, href) {
	let html = $link.outerHTML;

	html = html.replace($link.getAttribute('href'), href);
	html = html.replace(/disabled=[^>\s]*/, '');
	html = html.replace(/\s/g, '');

	return crc32(html);
}


function createCssElement($link) {
	if (browser.isFirefox()) {
		const $style = document.createElement('style');
		$style.textContent = '@import "' + $link.href + '"';

		for (let attr of Array.from($link.attributes)) {
			$style.setAttribute(attr.name, attr.value);
		}

		$style.setAttribute('data-appgine', '');
		return $style;

	} else {
		const $cloned = $link.cloneNode(true);
		$cloned.setAttribute('data-appgine', '');
		return $cloned;
	}
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
	for (let item of window.appgineCssReload.loading) {
		const { $link } = item;

		if ($link.tagName.toLowerCase()==='style') {
			try {
				$link.sheet.cssRules; // see: https://www.phpied.com/when-is-a-stylesheet-really-loaded/
				window.appgineCssReload.loading.splice(window.appgineCssReload.loading.indexOf(item), 1);
				window.appgineCssReload.loaded.push(item);
				$link.onload && $link.onload(true);

			} catch (e) {}

		} else {
			for (let sheet of Array.from(document.styleSheets||[])) {
				if (sheet.ownerNode===$link) {
					window.appgineCssReload.loading.splice(window.appgineCssReload.loading.indexOf(item), 1);
					window.appgineCssReload.loaded.push(item);
					$link.onload && $link.onload(true);
				}
			}
		}
	}

	if (window.appgineCssReload.loading.length) {
		window.appgineCssReload.pending = setTimeout(loadCssStylesheet, 10);
	}
}


function insertStyleLink($link) {
	const $found = document.querySelectorAll('head > link');

	if ($found.length) {
		const $foundLast = $found[$found.length-1];

		if ($foundLast.nextSibling) {
			document.head.insertBefore($link, $foundLast.nextSibling);

		} else {
			document.head.appendChild($link);
		}

	} else if (document.head.firstElementChild) {
		document.head.insertBefore($link, document.head.firstElementChild);

	} else {
		document.head.appendChild($link);
	}
}
