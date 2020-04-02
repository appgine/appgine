
import { listen, ERROR } from 'appgine/lib/errorhub'
import loadScript from 'appgine/addons/loadScript'
import cloneToSerializable from 'appgine/lib/lib/cloneToSerializable'


export default function bridgeSentry(src, endpoint, config, filterErrors=false) {
	let handler;

	if (process.env.NODE_ENV === 'production') {
		if (filterErrors) {
			config = config || {};
			config.ignoreErrors = Array.isArray(config.ignoreErrors) && config.ignoreErrors || [];
			config.ignoreUrls = Array.isArray(config.ignoreUrls) && config.ignoreUrls || [];

			const bindBeforeSend = config.beforeSend;

			let firstEventSent = false;
			config.beforeSend = function(event) {
				if (firstEventSent===false || Math.random()<0.1) {
					firstEventSent = true;

					if (bindBeforeSend) {
						return bindBeforeSend.apply(config, arguments);
					}

					return event;
				}

				return null; // reject event
			}

			// Random plugins/extensions
			config.ignoreErrors.push('top.GLOBALS');
			config.ignoreErrors.push('redefine non-configurable property');
			config.ignoreErrors.push('SecurityError: Attempt to use history');
			// See: http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
			config.ignoreErrors.push('originalCreateNotification');
			config.ignoreErrors.push('canvas.contentDocument');
			config.ignoreErrors.push('MyApp_RemoveAllHighlights');
			config.ignoreErrors.push('http://tt.epicplay.com');
			config.ignoreErrors.push('Can\'t find variable: ZiteReader');
			config.ignoreErrors.push(/Can\'t find variable: MyApp/);
			config.ignoreErrors.push('jigsaw is not defined');
			config.ignoreErrors.push('ComboSearch is not defined');
			config.ignoreErrors.push('http://loading.retry.widdit.com/');
			config.ignoreErrors.push('atomicFindClose');
			// Facebook borked
			config.ignoreErrors.push('fb_xd_fragment');
			// ISP "optimizing" proxy - `Cache-Control: no-transform` seems to
			// reduce this. (thanks @acdha)
			// See http://stackoverflow.com/questions/4113268
			config.ignoreErrors.push('bmi_SafeAddOnload');
			config.ignoreErrors.push('EBCallBackMessageReceived');
			// See http://toolbar.conduit.com/Developer/HtmlAndGadget/Methods/JSInjection.aspx
			config.ignoreErrors.push('conduitPage');

			// Facebook flakiness
			config.ignoreUrls.push(/graph\.facebook\.com/i);
			// Facebook blocked
			config.ignoreUrls.push(/connect\.facebook\.net\/en_US\/all\.js/i);
			// Woopra flakiness
			config.ignoreUrls.push(/eatdifferent\.com\.woopra-ns\.com/i);
			config.ignoreUrls.push(/static\.woopra\.com\/js\/woopra\.js/i);
			// Chrome extensions
			config.ignoreUrls.push(/extensions\//i);
			config.ignoreUrls.push(/^chrome:\/\//i);
			// Other plugins
			config.ignoreUrls.push(/127\.0\.0\.1:4001\/isrunning/i);  // Cacaoweb
			config.ignoreUrls.push(/webappstoolbarba\.texthelp\.com\//i);
			config.ignoreUrls.push(/metrics\.itunes\.apple\.com\.edgesuite\.net\//i);
		}

		handler = createHandler(src, endpoint, config);

	} else {
		handler = console.log.bind(console);
	}

	return function(options) {
		const listener = listen(handler);

		const { onDispose } = options;
		options.onDispose = function() {
			try { listener(); } catch (e) {}
			onDispose && onDispose.apply(this, arguments)
		}

		return options;
	}
}

let lastError = 0;
export function createHandler(src, endpoint, config={}) {
	return function(errno, error, e, ...payload) {
		if (errno===ERROR.GLOBAL) {
			return false;
		}

		loadScript(src, function(first) {
			if (window.Sentry) {
				if (first) {
					window.Sentry.init({ dsn: endpoint, ...config});
				}

				if (Date.now()-lastError > 10e3) {
					lastError = Date.now();

					window.Sentry.withScope(scope => {
						scope.setExtra('errno', errno);
						scope.setExtra('error', error);
						scope.setExtra('payload', cloneToSerializable(payload));
						isError(e) ? window.Sentry.captureException(e) : window.Sentry.captureMessage(error);
					});
				}
			}
		});
	}
}


// Yanked from https://git.io/vS8DV re-used under CC0
// with some tiny modifications
function isError(value) {
  switch ({}.toString.call(value)) {
    case '[object Error]': return true;
    case '[object Exception]': return true;
    case '[object DOMException]': return true;
    default: return value instanceof Error;
  }
}
