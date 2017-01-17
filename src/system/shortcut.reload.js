

export default function createPlugin(reload) {
	if (!Array.isArray(reload)) {
		reload = ['ctrl+R', 'meta+R', 'f5'];
	}

	return function create() {
		this.onValidShortcut(...reload, e => {
			e.preventDefault();
			this.dispatch('app.event', 'reload');
		});
	}
}
