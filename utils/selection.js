

export function getStart($element) {
	try { return $element.selectionStart || null; } catch (e) { return null; }
}


export function getEnd($element) {
	try { return $element.selectionEnd || null; } catch (e) { return null; }
}


export function setStart($element, position) {
	try { $element.selectionStart = position; } catch(e) {}
}


export function setEnd($element, position) {
	try { $element.selectionEnd = position; } catch(e) {}
}


export function setCursorAtEnd($element) {
	const position = $element && $element.value && $element.value.length || 0;
	setStart($element, position);
	setEnd($element, position);
}
