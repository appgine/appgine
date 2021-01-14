
import { listen } from 'appgine/errorhub'
import loadScript from 'appgine/addons/loadScript'
import cloneToSerializable from 'appgine/utils/cloneToSerializable'


export default function bridgeRaven(src, endpoint, config) {
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


export function createHandler(src, endpoint, config) {
	return function(errno, error, e, ...payload) {
		loadScript(src, function(first) {
			if (window.Raven) {
				if (first) {
					window.Raven.config(endpoint, config);
				}

				if (isError(e)) {
					window.Raven.captureException(e, cloneToSerializable({ errno, error, payload }));

				} else {
					window.Raven.captureMessage(error, cloneToSerializable({ errno, error, payload }));
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
