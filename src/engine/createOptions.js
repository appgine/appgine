
import * as errorhub from '../errorhub'
import swap from '../lib/swap'
import Request from './Request'
import * as locale from '../locale'
import { dispatch } from 'appgine/hooks/channel'


export default function createOptions(options={}) {
	return patchTryCatch({
		...options,
		onDispose() {
			options.onDispose && options.onDispose();
		},
		timeout: options.timeout ? Math.max(0, parseInt(options.timeout, 10)) : undefined,
		locale: (options.lang==='locale' || locale[options.lang]===undefined) ? locale.en : locale[options.lang],
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
		swap(requestFrom, requestTo, isRequestNew, isRequestInitial) {
			options.onBeforeSwap && options.onBeforeSwap(requestFrom, requestTo, isRequestNew, isRequestInitial);
			swap(requestFrom, requestTo, isRequestNew, isRequestInitial);
			options.onAfterSwap && options.onAfterSwap(requestFrom, requestTo, isRequestNew, isRequestInitial);
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

				} catch(e) {
					errorhub.dispatch(errorhub.ERROR.OPTIONS, 'Failed to handle options.' +key+ '().\n' + String(e||''), e);
				}
			}
		}
	}

	return options;
}
