
import { string } from 'appgine/closure'


export function normalizeText(text) {
	return string.collapseWhitespace(text);
}

export function canonizeText(text) {
	if (typeof text !== 'string') {
		return '';
	}

	if (text.normalize) {
		text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
	}

	return string.collapseWhitespace(text).toLowerCase();
}
