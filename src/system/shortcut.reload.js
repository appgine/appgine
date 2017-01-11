

export default function create() {
	this.onShortcut('ctrl+R', 'meta+R', 'f5', e => {
		e.preventDefault();
		this.dispatch('app.event', 'reload');
	});
}
