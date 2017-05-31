
import closure from '../closure'


export default function create() {
	const onClick = e => {
		const $link = closure.dom.getLink(e);

		if ($link) {
			if ($link.protocol==='http:' || $link.protocol==='https:') {
				const href = String($link.href||'');

				if (href && !e.defaultPrevented) {
					const toTarget = (function() {
						if (e && (e.metaKey || e.ctrlKey)) {
							return '_blank';

						} else if ($link.getAttribute('target')) {
							return $link.getAttribute('target');
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

	document.addEventListener('click', onClick, false);

	return function() {
		document.removeEventListener('click', onClick, false);
	}
}
