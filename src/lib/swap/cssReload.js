

export default function cssReload($into, option)
{
	if (option) {
		option = typeof option==='function' ? option : (href => href);

		let $enabled = [];
		Array.from($into.querySelectorAll('link')).forEach(function($link) {
			if (option($link.getAttribute('href'))) {
				const html = $link.outerHTML.replace($link.getAttribute('href'), option($link.getAttribute('href')));

				let $found = null;
				Array.from(document.head.querySelectorAll('link')).forEach(function($link) {
					if (html===$link.outerHTML.replace($link.getAttribute('href'), option($link.getAttribute('href')))) {
						$found = $link;
					}
				});

				if ($found===null) {
					$found = $link.cloneNode(true);
					document.head.appendChild($found);
				}

				$link.disabled = true;
				$enabled.push($found);
			}
		});

		Array.from(document.head.querySelectorAll('link')).forEach(function($link) {
			$link.disabled = $enabled.indexOf($link)===-1;
		});
	}
}
