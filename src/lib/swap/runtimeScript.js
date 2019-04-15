

export default function runtimeScript($script)
{
	const $newScript = document.createElement('script');

	for (let attr of ['charset', 'type', 'async', 'defer', 'src']) {
		if ($script.hasAttribute(attr)) {
			$newScript.setAttribute(attr, $script.getAttribute(attr));
		}
	}

	$newScript.textContent = $script.textContent;
	$script.parentNode.replaceChild($newScript, $script);
}
