
import closure from '../closure'


export default function createListeners(onArgs) {
	let index = 0;
	const listeners = [];

	return {
		create(type, $element, ...args) {
			++index;
			let useCapture = false;
			let handler = args.pop();

			if (typeof handler==='boolean') {
				useCapture = handler;
				handler = args.pop();
			}

			onArgs && onArgs(args);

			const listener = { type, $element, index, args, handler, useCapture };
			listeners.push(listener);

			return function() {
				if (listeners.indexOf(listener)!==-1) {
					listeners.splice(listeners.indexOf(listener), 1)
				}
			}
		},
		find(...args) {
			const _listeners = [];

			for (let listener of listeners) {
				listener: {
					for (let j=0; j<args.length; j++) {
						filter: {
							let [type, ...filters] = args[j];

							if (listener.type===type) {
								for (let filter of filters) {
									if (typeof filter==='function') {
										if (!filter(listener.$element, listener.args)) {
											break filter;
										}
									}

									if (!filter) {
										break filter;
									}
								}

								_listeners.push(listener);
								break listener;
							}
						}
					}
				}
			}

			_listeners.sort(function(a, b) {
				if (a.useCapture && b.useCapture) {
					[b, a] = [a, b];

				} else if (a.useCapture || b.useCapture) {
					return a.useCapture ? -1 : 1;
				}

				if (a.$element && b.$element) {
					return closure.dom.compareNodeOrder(b.$element, a.$element);

				} else if (a.$element || b.$element) {
					return a.$element ? -1 : 1;
				}

				return a.index-b.index;
			});

			return _listeners;
		},
	}
}
