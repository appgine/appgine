
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

let $loaded = null;
let $loading = [];
let pending = null;
let swaplist = [];

export default function bridgeCssReload(options={}, transform=defaultTransform) {
	const { onBeforeSwap } = options;

	options.onBeforeSwap = function(requestFrom, requestTo) {
		if ($loaded===null) {
			$loaded = Array.from(document.head.querySelectorAll('link[rel*=stylesheet]'));

			$loaded.forEach(function($link) {
				const cssid = buildLinkMD5($link, transform($link.getAttribute('href')))
				const swapid = buildLinkMD5($link, transformWithSearch($link.getAttribute('href'), false))
				$link.setAttribute('data-appgine-cssid', cssid);
				$link.setAttribute('data-appgine-swapid', swapid);
			});
		}

		onBeforeSwap && onBeforeSwap(...arguments);
		const { $fragment } = requestTo;

		let $enabled = [];
		let $swapped = [];
		Array.from($fragment.querySelectorAll('link[rel*=stylesheet]')).forEach(function($link) {
			if (transform($link.getAttribute('href'))) {
				const cssid = buildLinkMD5($link, transform($link.getAttribute('href')));
				const swapid = buildLinkMD5($link, transformWithSearch($link.getAttribute('href'), false));

				let $exists = null;
				let $swap = null;

				[].concat($loaded, $loading).forEach(function($link) {
					if ($link.getAttribute('data-appgine-cssid')===cssid) {
						$exists = $link;
					}
				});

				$loaded.forEach(function($link) {
					if ($link.getAttribute('data-appgine-swapid')===swapid && !$link.disabled) {
						$swap = $link;
					}
				});

				if ($exists===null) {
					$exists = createCssElement($link.cloneNode(true), function($exists) {
						swaplist = swaplist.filter(([$link, $swap]) => {
							if ($link===$exists) {
								$swap.disabled = true;
								return false;
							}

							return true;
						});
					});

					$exists.setAttribute('data-appgine-cssid', cssid);
					$exists.setAttribute('data-appgine-swapid', swapid);

					$loaded.indexOf($exists)===-1 && $loading.push($exists);
					document.head.appendChild($exists);
				}

				if ($swap && $swap!==$exists && $loading.indexOf($exists)!==-1) {
					$swapped.push($swap);
					swaplist.push([$exists, $swap]);
				}

				$link.disabled = true;
				$exists.disabled = false;
				$enabled.push($exists);
			}
		});

		[].concat($loaded, $loading).forEach(function($link) {
			if ($enabled.indexOf($link)===-1 && $swapped.indexOf($link)===-1) {
				$link.disabled = true;
			}
		});

		swaplist = swaplist.filter(([$link, $swap]) => !$link.disabled && !$swap.disabled && $enabled.indexOf($swap)===-1);

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


function createCssElement($link, cb) {
	let done = false;
	let $element = $link;
	function onDone(e) {
		if (!browser.isFirefox() || e===true) {
			$link.onload = null;
			$link.onreadystatechange = null;

			if ($link.removeEventListener) {
				$link.removeEventListener('load', onDone);
			}

			if (done===false) {
				done = true;
				cb($element);
			}
		}
	}

	if (browser.isFirefox()) {
		const $style = document.createElement('style');
		$style.textContent = '@import "' + $link.href + '"';
		$style.onload = onDone;

		for (let attr of $link.attributes) {
			$style.setAttribute(attr.name, attr.value);
		}

		return $element = $style;

	} else {
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

		return $link;
	}
}


function loadCssStylesheet() {
	for (let $element of $loading) {
		if ($element.tagName==='style') {
			try {
				$element.sheet.cssRules; // see: https://www.phpied.com/when-is-a-stylesheet-really-loaded/
				$loading.indexOf($element)!==-1 && $loading.splice($loading.indexOf($element), 1);
				$loaded.indexOf($element)===-1 && $loaded.push($element);
			    $element.onload && $element.onload(true);

			} catch (e) {}

		} else {
			for (let sheet of document.styleSheets) {
				if (sheet.ownerNode===$element) {
					$loading.indexOf($element)!==-1 && $loading.splice($loading.indexOf($element), 1);
					$loaded.indexOf($element)===-1 && $loaded.push($element);
					$element.onload && $element.onload(true);
				}
			}
		}
	}

	if ($loading.length) {
		pending = setTimeout(loadCssStylesheet, 10);
	}
}
