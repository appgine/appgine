
import closure from '../closure'


export default function create() {
	const onClick = e => {
		const $link = closure.dom.getLink(e);

		if ($link) {
			if ($link.protocol==='http:' || $link.protocol==='https:') {
				const href = String($link.href||'');

				if (href && !e.defaultPrevented && (e.which!==2 && e.which!==3)) {
					const toTarget = (function() {
						if (e && (e.metaKey || e.ctrlKey)) {
							return '_blank';

						} else if ($link.getAttribute('target')) {
							return $link.getAttribute('target');

						} else if ($link.getAttribute('data-target')) {
							return $link.getAttribute('data-target');
						}

						return '';
					})();

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
