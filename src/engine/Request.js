
import {
	loadScripts, unloadScripts,
	loadGlobal, reloadStatic, loadAtomic, unloadAtomic
} from './plugins'

import createFragment from '../lib/createFragment'


export default class Request {


	constructor(endpoint, text, scrollTo) {
		this.endpoint = endpoint;
		this.text = text;
		this.$fragment = createFragment(text);

		if (typeof scrollTo === 'string' || typeof scrollTo === 'function') {
			this.scrollTop = 0;
			this.scrolled = scrollTo;

		} else if (scrollTo === false) {
			this.scrollTop = 0;
			this.scrolled = true;

		} else {
			this.scrollTop = parseInt(scrollTo||0, 10);
			this.scrolled = -1;
		}

		this.redirect = null;
		this.canonize = null;
		this.swap = null;

		loadScripts(this.$fragment);
		loadGlobal(this.$fragment);
		reloadStatic(this.$fragment);
		loadAtomic(this.$fragment, this);
	}

	willRedirect(...redirect) { this.redirect = redirect; }
	willCanonize(...canonize) { this.canonize = canonize; }
	willSwap(...swap) { this.swap = swap; }

	dispose() {
		unloadAtomic(this.$fragment, this);
		unloadScripts(this.$fragment);
	}

}
