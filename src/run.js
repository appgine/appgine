
import ready from './lib/ready'
import * as history from './engine/history'
import run, { onClick, onClickHash, onSubmitForm, onReload, onLeave } from './engine/run'
import { uri } from 'appgine/closure'
import createLoader from './plugins/loader'

import { addListener } from 'appgine/hooks/channel'


export default function(options={}) {
	options = {...options}

	if (options.ignoreURIParams) {
		uri.ignoreURIParams(options.ignoreURIParams);
	}

	createLoader(function({ bindSelector, bindSystem }) {
		bindSystem(require.resolve('./system/touchable'));
		bindSystem(require.resolve('./system/clickBlur'));
		bindSystem(require.resolve('./system/click'));
		bindSystem(require.resolve('./system/submitForm'));

		if (options.reload===undefined || options.reload) {
			bindSystem(require.resolve('./system/shortcut.reload'), options.reload);
		}

		bindSystem(require.resolve('./system/tabIndex'));
		bindSystem(require.resolve('./system/metaReload'));

		if (options.dragAndDropClass) {
			bindSystem(require.resolve('./system/dragAndDrop'), options.dragAndDropClass);
		}

		bindSelector('noscript[data-render-visible]', require.resolve('../addons/plugins/data-render-visible'));
	});

	if (options.ajax!==false) {
		addListener('app.event', 'click', onClick);
		addListener('app.event', 'clickHash', onClickHash);
	}

	addListener('app.event', 'submit', function(e, ...args) {
		if (options.ajax!==false || e.isTrusted===false) {
			onSubmitForm(e, ...args);
		}
	});

	addListener('app.event', 'reload', onReload);
	addListener('meta-reload', 'reload', url => url ? onLeave(url) : onReload())

	if (window.appgine) {
		window.appgine = function(scrollTo, bodyClassName) {
			window.appgine = true;
			history.init(options.ajax!==false);
			run(options, String(window.location.hash).substr(1) || scrollTo, bodyClassName, false);
		}

	} else {
		window.appgine = true;
		history.init(options.ajax!==false);
		ready(() => run(options, String(window.location.hash).substr(1) || false, null, true));
	}
}
