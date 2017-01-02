
import closure from '../closure'


export default function create() {
	const onClick = e => {
		const $link = closure.dom.getLink(e);
		const href = $link && String($link.href||'');

		if ($link && href && !e.defaultPrevented) {
			const toTarget = (function() {
				if (e && (e.metaKey || e.ctrlKey)) {
					return '_blank';

				} else if (e.target && e.target.getAttribute('target')) {
					return e.target.getAttribute('target');
				}

				return '';
			})();

			if ($link.getAttribute('href')[0]==='#') {
				this.dispatch('app.event', 'clickHash', e, $link, $link.getAttribute('href').substr(1), toTarget);

			} else {
				this.dispatch('app.event', 'click', e, $link, href, toTarget);
			}
		}
	}

	document.addEventListener('click', onClick, false);

	return function() {
		document.removeEventListener('click', onClick, false);
	}
}
