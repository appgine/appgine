
import ready from './lib/ready'
import run, { onClick, onClickHash, onSubmitForm, onReload, onLeave } from './engine/run'
import { addListener } from './api/channel'
import { scrollTop } from './closure'


export default function(options={}) {
	options = {...{bindApi: {}}, ...options}

	require('./plugins').loaderGlobal(function({ bindApi }) {
		if (options.bindApi.channel!==false) {
			bindApi('channel', require('./api/channel').default);
		}

		if (options.bindApi.update!==false) {
			bindApi('update', require('./api/update').default);
		}

		if (options.bindApi.method!==false) {
			bindApi('method', require('./api/method').default);
		}

		if (options.bindApi.targets!==false) {
			bindApi('targets', require('./api/targets').default);
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

		if (options.bindApi.event!==false) {
			bindApi('event', require('./api/event').default);
		}

		if (options.bindApi.ajax!==false) {
			bindApi('ajax', require('./api/ajax').default);
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

	addListener('app.event', 'click', onClick);
	addListener('app.event', 'clickHash', onClickHash);
	addListener('app.event', 'submit', onSubmitForm);
	addListener('app.event', 'reload', onReload);

	addListener('meta-reload', 'reload', url => url ? onLeave(url) : onReload())

	if (window.appgine) {
		window.appgine = function(scrollTo, bodyClassName) {
			window.appgine = true;
			run(options, String(window.location.hash).substr(1) || scrollTo, bodyClassName);
		}

	} else {
		window.appgine = true;
		ready(() => run(options, String(window.location.hash).substr(1) || scrollTop()));
	}
}
