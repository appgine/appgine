
import { shortcuthandler } from '../closure'


export default function create() {
	return shortcuthandler('ctrl+R', 'meta+R', 'F5', e => {
		e.preventDefault();
		this.dispatch('app.event', 'reload');
	});
}
