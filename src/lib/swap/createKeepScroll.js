
import { findNodes } from 'appgine/utils/dom'


export default function createKeepScroll($node) {
	const $scrolled = [];
	const scrolls = [];

	findNodes($node, $child => $child.scrollTop>0 || $child.scrollLeft>0).forEach(function($child) {
		$scrolled.push($child);
		scrolls.push([$child.scrollLeft, $child.scrollTop]);
	});

	return function() {
		findNodes($node, $child => $scrolled.indexOf($child)!==-1).forEach(function($child) {
			$child.scrollLeft = scrolls[$scrolled.indexOf($child)][0];
			$child.scrollTop = scrolls[$scrolled.indexOf($child)][1];
		});
	}
}
