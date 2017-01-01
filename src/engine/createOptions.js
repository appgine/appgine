

import createFragment from '../lib/createFragment'
import swap from '../lib/swap'
import { dispatch } from '../api/channel'


export default function createOptions(options={}) {
	return {
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
			return dispatch(...args);
		},
		onRedirect(endpoint) {
			window.location.href = endpoint;
			return false;
		},
		onError(err) {
			return options.onError && options.onError(err);
		},
		onAjaxResponse(fn) {
			return function(err, html, json) {
				const _err = options.onAjaxError ? options.onAjaxError(err, html, json) : err;
				const _html = options.onAjaxHtml ? options.onAjaxHtml(err, html, json) : html;
				const _json = options.onAjaxJson ? options.onAjaxJson(err, html, json) : json;

				return fn(_err, _html, _json);
			}
		},
		onFormData(formData) {
			return options.onFormData ? options.onFormData(formData) : formData;
		},
	}
}
