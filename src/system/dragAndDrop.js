
import closure from '../closure'


export default function createDragAndDrop(bodyClass) {
	return function create() {
		const eventList = [
			['dragstart', 'add', false],
			['dragend', 'remove', false],
			['drop', 'remove', true], // Fix: Firefox redirect ondrop into <a/>
		];

		eventList.map(eventObj => {
			const [event, fn, prevent] = eventObj;
			const listener = function(e) {
				prevent && e.preventDefault();
				setTimeout(function() {
					closure.classes[fn](document.body, bodyClass);
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
