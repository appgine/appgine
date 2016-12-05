
import closure from '../closure'


export default function create() {
	const onClickHash = e => {
		let $link = closure.dom.getLink(e);
		if ($link && closure.uri.isHashLink($link.href)) {
			e.preventDefault();
			e.stopImmediatePropagation();
			this.dispatch('app.event', 'clickHash', closure.uri.getHash($link.href));
		}
	}

	const onClick = e => {
		let $link = closure.dom.getLink(e);
		if ($link && e.metaKey===false && $link.target!=='_blank' && $link.hostname===window.location.hostname) {
			e.preventDefault();

			var href;
			if (href = $link.href) {
				this.dispatch('app.event', 'click', href.indexOf('#')!==-1 ? href.substr(0, href.indexOf('#')) : href);
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
