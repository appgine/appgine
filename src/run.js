
import ready from './lib/ready'
import run, { onClick, onClickHash, onSubmitForm, onReload } from './engine/run'
import { addListener } from './api/channel'


export default function(options={}) {
	options = {...{bindApi: {}}, ...options}

	require('./plugins').loaderGlobal(function({ bindApi }) {
		if (options.bindApi.channel!==false) {
			bindApi('channel', require('./api/channel').default);
		}

		if (options.bindApi.targets!==false) {
			bindApi('targets', require('./api/targets').default);
		}
	});

	require('./plugins').loader(function({ bindApi, bindSystem }) {
		bindApi('channel', require('./api/channel').default);

		bindSystem(require('./system/touchable').default);
		bindSystem(require('./system/clickBlur').default);
		bindSystem(require('./system/click').default);
		bindSystem(require('./system/submitForm').default);
		bindSystem(require('./system/shortcut.reload').default);
		bindSystem(require('./system/tabIndex').default);

		if (options.dragAndDropClass) {
			bindSystem(require('./system/dragAndDrop').default, plugin => plugin(options.dragAndDropClass));
		}
	});

	addListener('app.event', 'click', onClick);
	addListener('app.event', 'clickHash', onClickHash);
	addListener('app.event', 'submit', onSubmitForm);
	addListener('app.event', 'reload', onReload);

	ready(() => run(options));
}
