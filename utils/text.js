

export function collapseWhitespace(text) {
	return text.replace(/[\s\xa0]+/g, ' ').replace(/^\s+|\s+$/g, '');
}


export function normalizeText(text) {
	return collapseWhitespace(text);
}


export function canonizeText(text) {
	if (typeof text !== 'string') {
		return '';
	}

	if (text.normalize) {
		text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
	}

	return collapseWhitespace(text).toLowerCase();
}


export function getRandomString()
{
	return Math.floor(Math.random() * 2147483648).toString(36) + Math.abs(Math.floor(Math.random() * 2147483648) ^ Date.now()).toString(36);
}
