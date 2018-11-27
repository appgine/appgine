
import closure from '../closure'


export default function createDragAndDrop(bodyClass) {
	return function create() {
		const eventList = [
			['dragstart', true, false],
			['dragend', false, false],
			['drop', false, true], // Fix: Firefox redirect ondrop into <a/>
		];

		eventList.map(eventObj => {
			const [event, toggle, prevent] = eventObj;
			const listener = function(e) {
				prevent && e.preventDefault();
				setTimeout(function() {
					document.body.classList.toggle(bodyClass, toggle)
				}, 200);
			}

			eventObj.push(listener);
			document.addEventListener(event, listener);
		});

		return function destory() {
			eventList.map(([event,,, listener]) => {
				document.removeEventListener(event, listener);
			})
		}
	}
}
