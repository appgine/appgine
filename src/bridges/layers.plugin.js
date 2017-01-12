


export default function create($element) {

	function onClick(e) {
		const $target = e.target;
		const target = $target.target;
		$target.target = '_current';
		setTimeout(() => $target.target = target);
	}

	$element.addEventListener('click', onClick);

	this.onShortcut('left', function(e) {});
	this.onShortcut('right', function(e) {});
	this.onShortcut('esc', function(e) {});

	return {
		destroy() {
			$element.removeEventListener('click', onClick);
		}
	}
}
