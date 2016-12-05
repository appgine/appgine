
import closure from '../closure'


if (closure.cookies.get('skip')!=='1') {
	closure.cookies.set('skip', '1', 365*86400, '/');
}

let timezone = new Date().getTimezoneOffset().toString();
if (closure.cookies.get('timezone')!==timezone) {
	closure.cookies.set('timezone', timezone, 86400, '/')
}

if (window.location.hash==='#_=_' || window.location.href.substr(-1)==='#') {
	window.location.hash = ''; // for older browsers, leaves a # behind

	if (window.history && window.history.replaceState) {
		window.history.replaceState('', document.title, window.location.pathname);
	}
}
