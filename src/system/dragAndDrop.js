
import { useEvent } from 'appgine/hooks/event'


export default function create(bodyClass) {
	const eventList = [
		['dragstart', true, false],
		['dragend', false, false],
		['drop', false, true], // Fix: Firefox redirect ondrop into <a/>
	];

	eventList.map(([event, toggle, prevent]) => {
		useEvent(document, event, function(e) {
			prevent && e.preventDefault();
			setTimeout(function() {
				document.body.classList.toggle(bodyClass, toggle)
			}, 200);
		});
	});
}
