
import { listen } from 'appgine/lib/errorhub'


export default function bridgeSentry(src, endpoint, config) {
	let handler;

	if (process.env.NODE_ENV === 'production') {
		handler = createHandler(src, endpoint, config);

	} else {
		handler = console.log.bind(console);
	}

	return function(options) {
		const listener = listen(handler);

		const { onDispose } = options;
		options.onDispose = function() {
			try { listener(); } catch (e) {}
			onDispose.apply(this, arguments)
		}

		return options;
	}
}


export function createHandler(src, endpoint, config={}) {
	return function(errno, error, e, ...payload) {
		loadScript(src, function(first) {
			if (window.Sentry) {
				if (first) {
					window.Sentry.init({ dns: endpoint, ...config});
				}

				if (isError(e)) {
					window.Sentry.withScope(scope => {
						scope.setExtra('errno', errno);
						scope.setExtra('error', error);
						scope.setExtra('payload', cloneToSerializable(payload));
						window.Sentry.captureException(e);
					});

				} else {
					window.Sentry.withScope(scope => {
						scope.setExtra('errno', errno);
						scope.setExtra('error', error);
						scope.setExtra('payload', cloneToSerializable(payload));
						window.Sentry.captureMessage(error);
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
