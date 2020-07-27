
import { dom } from 'appgine/closure'


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

			const onArgsResult = onArgs && onArgs(...args);
			args = onArgsResult===undefined ? args : onArgsResult;

			const listener = { type, $element, index, args, handler, useCapture };
			listeners.push(listener);

			return function() {
				if (listeners.indexOf(listener)!==-1) {
					listeners.splice(listeners.indexOf(listener), 1)
				}
			}
		},
		contains(listener) {
			return listeners.indexOf(listener)!==-1;
		},
		find(...args) {
			const _listeners = [];

			for (let listener of listeners) {
				listener: {
					for (let j=0; j<args.length; j++) {
						filter: {
							let [type, ...filters] = args[j];
							let typeArgs = [];

							if (Array.isArray(type)) {
								typeArgs = type;
								[type, ...filters] = filters;
							}

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

								_listeners.push({ type, typeArgs, listener });
								break listener;
							}
						}
					}
				}
			}

			_listeners.sort(function(a, b) {
				if (a.listener.useCapture && b.listener.useCapture) {
					[b, a] = [a, b];

				} else if (a.listener.useCapture || b.listener.useCapture) {
					return a.listener.useCapture ? -1 : 1;
				}

				if (a.listener.$element && b.listener.$element) {
					return dom.compareNodeOrder(b.listener.$element, a.listener.$element);

				} else if (a.listener.$element || b.listener.$element) {
					return a.listener.$element ? -1 : 1;
				}

				return a.listener.index-b.listener.index;
			});

			return _listeners;
		},
	}
}
