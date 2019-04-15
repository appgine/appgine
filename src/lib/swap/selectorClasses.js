

export default function swap(selector, $from, $into) {
	const $dom = document.querySelector(selector);

	if ($dom) {
		const classesFrom = getClasses(selector, $from);
		const classesInto = getClasses(selector, $into);

		let classesNew;
		classesNew = Array.from($dom.classList);
		classesNew = classesNew.filter(className => !classesFrom.includes(className));
		classesNew = classesNew.concat(classesInto.filter(className => !classesNew.includes(className)));

		$dom.className = classesNew.join(' ')
	}
}


function getClasses(selector, $dom) {
	let $found;

	if ($dom) {
		if (selector==='html' && $dom.tagName.toLowerCase()==='iframe') {
			$found = $dom;

		} else if ($dom.querySelector) {
			$found = $dom.querySelector(selector);
		}
	}

	return $found ? Array.from($found.classList) : [];
}
