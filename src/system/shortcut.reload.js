
import { useShortcut } from 'appgine/hooks/shortcut'
import { useDispatch } from 'appgine/hooks/channel'


export default function create(reload) {
	useShortcut(...createShortcuts(reload), function(e, { identifier }) {
		if (typeof reload==='function') {
			if (reload(identifier)===false) {
				return false;
			}
		}

		e.preventDefault();
		useDispatch('app.event', 'reload');
	});
}

function createShortcuts(reload) {
	if (typeof reload==='string') {
		return [reload];

	} else if (Array.isArray(reload)) {
		return reload;
	}

	return ['ctrl+R', 'meta+R', 'f5'];
}
