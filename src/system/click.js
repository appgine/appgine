
import closure from '../closure'


export default function create() {
	const onClickHash = e => {
		let $link = closure.dom.getLink(e);
		if ($link && closure.uri.isHashLink($link.href)) {
			e.preventDefault();
			e.stopImmediatePropagation();
			this.dispatch('app.event', 'clickHash', e, $link, closure.uri.getHash($link.href));
		}
	}

	const onClick = e => {
		let $link = closure.dom.getLink(e);
		if ($link && e.metaKey===false && e.ctrlKey===false && $link.hostname===window.location.hostname) {
			const href = String($link.href||'');

			if (href) {
				const toTarget = (function() {
					if (e && (e.metaKey || e.ctrlKey)) {
						return '_blank';

					} else if (e.target && e.target.getAttribute('target')) {
						return e.target.getAttribute('target');
					}

					return '';
				})();

				const [endpoint, ...hash] = href.split('#');
				this.dispatch('app.event', 'click', e, $link, endpoint, hash.join('#'), toTarget);

			} else {
				e.preventDefault();
			}
		}
	}

	document.addEventListener('click', onClickHash, false);
	document.addEventListener('click', onClick, false);

	return function() {
		document.removeEventListener('click', onClickHash, false);
		document.removeEventListener('click', onClick, false);
	}
}
