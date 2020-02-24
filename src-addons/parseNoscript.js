


let $textarea;
export default function parseNoscript($noscript)
{
	$textarea = $textarea || document.createElement('textarea');
	$textarea.innerHTML = $noscript ? String($noscript.textContent||'').replace(/&amp;/g, '&') : '';
	return $textarea.value;
}
