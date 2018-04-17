
import { scrollFormToView, setHashFixedEdge, setScrollPosition } from '../scroll'


export default function createFormScroll($form, top, hashFixedEdge) {
	const bounds = $form.getBoundingClientRect();

	return function($form) {
		setHashFixedEdge(hashFixedEdge);
		setScrollPosition(null);
		scrollFormToView($form, top);
	}
}
