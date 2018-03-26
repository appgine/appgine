
import swap from '../lib/swap'
import Request from './Request'
import { dispatch } from '../api/channel'


export default function createOptions(options={}) {
	return patchTryCatch({
		...options,
		onDispose() {
			options.onDispose && options.onDispose();
		},
		timeout: options.timeout ? Math.max(0, parseInt(options.timeout, 10)) : undefined,
		ignoreURIParams: [],
		dragAndDropClass: options.dragAndDropClass || '',
		abortOnEscape: options.abortOnEscape===undefined || options.abortOnEscape,
		onBeforeScroll($element) {
			options.onBeforeScroll && options.onBeforeScroll($element);
		},
		onScroll($element) {
			options.onScroll && options.onScroll($element);
		},
		onRemoveScroll($element) {
			options.onRemoveScroll && options.onRemoveScroll($element);
		},
		initHTML($html) {
			options.initHTML && options.initHTML($html);
		},
		createRequest(endpoint, $fragment, scrollTo) {
			options.initFragment && options.initFragment($fragment);

			const request = new Request(endpoint, $fragment, scrollTo);
			options.initRequest && options.initRequest(request);

			return request;
		},
		swap(requestFrom, requestTo) {
			options.onBeforeSwap && options.onBeforeSwap(requestFrom, requestTo);
			swap(requestFrom, requestTo);
			options.onAfterSwap && options.onAfterSwap(requestFrom, requestTo);
		},
		dispatch(...args) {
			dispatch(...args);
			options.dispatch && options.dispatch(...args);
		},
		onRedirect(endpoint) {
			return options.onRedirect ? options.onRedirect(endpoint) : false;
		},
		onLeave(endpoint) {
			options.onLeave ? options.onLeave(endpoint) : (window.location.href = endpoint);
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
	})
}


function patchTryCatch(options) {
	for (let key in options) {
		const val = options[key];
		if (typeof val==='function') {
			options[key] = function() {
				try {
					return val.apply(options, arguments);

				} catch(e) {}
			}
		}
	}

	return options;
}
