
import ready from './lib/ready'
import * as history from './engine/history'
import run, { onClick, onClickHash, onSubmitForm, onReload, onLeave } from './engine/run'
import { addListener } from './api/channel'
import { scrollTop, uri } from './closure'


export default function(options={}) {
	options = {...{bindApi: {}}, ...options}

	if (options.ignoreURIParams) {
		uri.ignoreURIParams(options.ignoreURIParams);
	}

	require('./plugins').loaderGlobal(function({ bindApi }) {
		if (options.bindApi.channel!==false) {
			bindApi('channel', require('./api/channel').default);
		}

		if (options.bindApi.update!==false) {
			bindApi('update', require('./api/update').default);
		}

		if (options.bindApi.targets!==false) {
			bindApi('targets', require('./api/targets').default);
		}

		if (options.bindApi.progress!==false) {
			bindApi('progress', require('./api/progress').default);
		}

		if (options.bindApi.request!==false) {
			bindApi('request', require('./api/request').default);
		}

		if (options.bindApi.bus!==false) {
			bindApi('bus', require('./api/bus').default);
		}

		if (options.bindApi.swap!==false) {
			bindApi('swap', require('./api/swap').default);
		}

		if (options.bindApi.shortcut!==false) {
			bindApi('shortcut', require('./api/shortcut').default);
		}

		if (options.bindApi.reload!==false) {
			bindApi('reload', require('./api/reload').default);
		}

		if (options.bindApi.reloadPlugins!==false) {
			bindApi('reloadPlugins', require('./api/reloadPlugins').default);
		}

		if (options.bindApi.event!==false) {
			bindApi('event', require('./api/event').default);
		}

		if (options.bindApi.ajax!==false) {
			bindApi('ajax', require('./api/ajax').default);
		}

		if (options.bindApi.tick!==false) {
			bindApi('tick', require('./api/tick').default);
		}

		if (options.bindApi.now!==false) {
			bindApi('now', require('./api/now').default);
		}

		if (options.bindApi.scroll!==false) {
			bindApi('scroll', require('./api/scroll').default);
		}

		if (options.bindApi.redirect!==false) {
			bindApi('redirect', require('./api/redirect').default);
		}
	});

	require('./plugins').loader(function({ bindApi, bindSelector, bindSystem }) {
		bindApi('channel', require('./api/channel').default);
		bindApi('shortcut', require('./api/shortcut').default);

		bindSystem(require('./system/touchable').default);
		bindSystem(require('./system/clickBlur').default);
		bindSystem(require('./system/click').default);
		bindSystem(require('./system/submitForm').default);

		if (options.reload===undefined || options.reload) {
			bindSystem(require('./system/shortcut.reload').default(options.reload));
		}

		bindSystem(require('./system/tabIndex').default);
		bindSystem(require('./system/metaReload').default);

		if (options.dragAndDropClass) {
			bindSystem(require('./system/dragAndDrop').default, plugin => plugin(options.dragAndDropClass));
		}

		bindSelector('noscript[data-render-visible]', require('../addons/plugins/data-render-visible'));
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
