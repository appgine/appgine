

import createFragment from '../lib/createFragment'
import swap from '../lib/swap'
import { dispatch } from '../api/channel'


export default function createOptions(options={}) {
	return {
		dragAndDropClass: options.dragAndDropClass || '',
		abortOnEscape: options.abortOnEscape===undefined || options.abortOnEscape,
		initHTML($html) {
			options.initHTML && options.initHTML($html);
		},
		createFragment(html) {
			const $fragment = createFragment(html);
			options.initFragment && options.initFragment($fragment);
			return $fragment;
		},
		swap(requestFrom, requestTo) {
			options.onBeforeSwap && options.onBeforeSwap();
			swap(requestFrom, requestTo);
			options.onAfterSwap && options.onAfterSwap();
		},
		dispatch(...args) {
			dispatch(...args);
			options.dispatch && options.dispatch(...args);
		},
		onRedirect(endpoint) {
			return options.onRedirect ? options.onRedirect(endpoint) : false;
		},
		onError(err) {
			return options.onError && options.onError(err);
		},
		onResponse(fn) {
			return function(status, response) {
				options.onResponse && options.onResponse(status, response);
				status = (options.changeResponseStatus && options.changeResponseStatus(status, response)) || status;

				return fn(status, response);
			}
		},
		onFormData(formData) {
			return options.onFormData ? options.onFormData(formData) : formData;
		},
	}
}
