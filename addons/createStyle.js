
import { cssom } from 'appgine/closure'


export default function createStyle(cssText='') {
	const $style = cssom.addCssText(cssText);
	$style.setAttribute('data-appgine', '');
	return $style.sheet;
}
