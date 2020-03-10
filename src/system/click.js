
import closure from '../closure'
import { getEventTarget, getElementTarget } from '../lib/target'


export default function create() {
	const onClick = e => {
		const $link = closure.dom.getLink(e);

		if ($link) {
			if ($link.protocol==='') {
				$link.href = $link.href; // fix IE bug with React/Preact Element
			}

			if ($link.protocol==='http:' || $link.protocol==='https:') {
				const href = String($link.href||'');

				if (href && !e.defaultPrevented && (e.which!==2 && e.which!==3)) {
					const toTarget = getEventTarget(e) || getElementTarget($link);

					if ($link.getAttribute('href')[0]==='#') {
						this.dispatch('app.event', 'clickHash', e, $link, $link.getAttribute('href').substr(1), toTarget);

					} else {
						this.dispatch('app.event', 'click', e, $link, toTarget);
					}
				}
			}
		}
	}

	this.event(document, 'click', onClick, false);
}
