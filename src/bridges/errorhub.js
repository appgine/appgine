
import { listen, createRavenHandler } from '../errorhub'


export default function bridgeErrorhub({ raven }={}) {
	let handler;

	if (process.env.NODE_ENV === 'production' && raven) {
		handler = createRavenHandler(raven.src, raven.endpoint);

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
