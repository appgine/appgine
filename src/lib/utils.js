

export function intersection(rect1, rect2) {
	const x0 = Math.max(rect1.left, rect2.left);
	const x1 = Math.min(rect1.left + rect1.width, rect2.left + rect2.width);

	if (x0 <= x1) {
		const y0 = Math.max(rect1.top, rect2.top);
		const y1 = Math.min(rect1.top + rect1.height, rect2.top + rect2.height);

		if (y0 <= y1) {
			rect1.left = x0;
			rect1.top = y0;
			rect1.width = x1 - x0;
			rect1.height = y1 - y0;

			return true;
		}
	}

	return false;
}
