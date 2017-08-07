

export default function createPlugin(reload) {
	let shortcuts = ['ctrl+R', 'meta+R', 'f5'];

	if (typeof reload==='string') {
		shortcuts = [reload];

	} else if (Array.isArray(reload)) {
		shortcuts = reload;
	}

	return function create() {
		this.onShortcut(...shortcuts, (e, { identifier }) => {
			if (typeof reload==='function') {
				if (reload(identifier)===false) {
					return false;
				}
			}

			e.preventDefault();
			this.dispatch('app.event', 'reload');
		});
	}
}
