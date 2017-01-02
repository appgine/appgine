
import ready from './lib/ready'
import run, { onClick, onClickHash, onSubmitForm, onReload } from './engine/run'
import { addListener } from './api/channel'


export default function(options={}) {
	options = {...{bindApi: {}}, ...options}

	require('./plugins').loaderGlobal(function({ bindApi }) {
		if (options.bindApi.channel!==false) {
			bindApi('channel', require('./api/channel'));
		}

		if (options.bindApi.targets!==false) {
			bindApi('targets', require('./api/targets'));
		}
	});

	require('./plugins').loader(function({ bindApi, bindSystem }) {
		bindApi('channel', require('./api/channel'));

		bindSystem(require('./system/touchable'));
		bindSystem(require('./system/clickBlur'));
		bindSystem(require('./system/click'));
		bindSystem(require('./system/submitForm'));
		bindSystem(require('./system/shortcut.reload'));
		bindSystem(require('./system/tabIndex'));

		if (options.dragAndDropClass) {
			bindSystem(require('./system/dragAndDrop'), plugin => plugin(options.dragAndDropClass));
		}
	});

	addListener('app.event', 'click', onClick);
	addListener('app.event', 'clickHash', onClickHash);
	addListener('app.event', 'submit', onSubmitForm);
	addListener('app.event', 'reload', onReload);

	ready(() => run(options));
}
