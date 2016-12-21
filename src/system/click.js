
import closure from '../closure'


export default function create() {
	const onClick = e => {
		const $link = closure.dom.getLink(e);
		const href = $link && String($link.href||'');

		if ($link && href) {
			const toTarget = (function() {
				if (e && (e.metaKey || e.ctrlKey)) {
					return '_blank';

				} else if (e.target && e.target.getAttribute('target')) {
					return e.target.getAttribute('target');
				}

				return '';
			})();

			const [endpoint, ...hash] = href.split('#');

			if (closure.uri.isHashLink(href)) {
				this.dispatch('app.event', 'clickHash', e, $link, hash.join('#'), toTarget);

			} else {
				this.dispatch('app.event', 'click', e, $link, endpoint, hash.join('#'), toTarget);
			}
		}
	}

	document.addEventListener('click', onClick, false);

	return function() {
		document.removeEventListener('click', onClick, false);
	}
}
