
import { dom } from 'appgine/closure'
import { getEventTarget, getElementTarget } from '../lib/target'

import { useEvent } from 'appgine/hooks/event'
import { useDispatch } from 'appgine/hooks/channel'


export default function create() {
	useEvent(document, 'click', function(e) {
		const $link = dom.getLink(e);

		if ($link && $link.protocol==='') {
			$link.href = $link.href; // fix IE bug with React/Preact Element
		}

		if ($link && ($link.protocol==='http:' || $link.protocol==='https:')) {
			const href = String($link.href||'');

			if (href && !e.defaultPrevented && (e.which!==2 && e.which!==3)) {
				const toTarget = getEventTarget(e) || getElementTarget($link);

				if ($link.getAttribute('href')[0]==='#') {
					useDispatch('app.event', 'clickHash', e, $link, $link.getAttribute('href').substr(1), toTarget);

				} else {
					useDispatch('app.event', 'click', e, $link, toTarget);
				}
			}
		}
	}, false);
}
