
import withContext from 'appgine/hooks'
import { useContext, bindContext } from 'appgine/hooks'


export function useEvent($node, name, fn, ...args) {
	return useContext(() => addObjEvent($node, name, bindContext(fn), ...args));
}


export function useTriggeredEvent($node, name, fn, ...args) {
	return fn(), useEvent($node, name, fn, ...args);
}


export function useEventOnce($node, name, fn, ...args) {
	return useContext(function() {
		fn = bindContext(fn);
		const destroy = addObjEvent($node, name, function() {
			destroy();
			return fn(...arguments);
		}, ...args);

		return destroy;
	});
}


export function useEventBoundery($node, eventstart, eventend, fn, ...args) {
	const startEvent = Array.isArray(eventstart) ? eventstart.unshift() : eventstart;
	const endEvent = Array.isArray(eventend) ? eventend.unshift() : eventend;
	const startArgs = Array.isArray(eventstart) ? eventstart : args;
	const endArgs = Array.isArray(eventend) ? eventend : args;

	let handler;
	return useEvent($node, startEvent, function(e) {
		if (handler===undefined) {
			handler = withContext({ $node }, function() {
				const result = fn(e);

				useEventOnce($node, endEvent, function(e) {
					result && result(e);
					handler();
					handler = undefined;
				}, ...endArgs);
			});
		}
	}, ...startArgs);
}


function addObjEvent($node, ...args) {
	if ($node.addEventListener) {
		$node.addEventListener(...args);
		return $node.removeEventListener && $node.removeEventListener.bind($node, ...args);

	} else if ($node.on) {
		$node.on(...args);
		return $node.off && $node.off.bind($node, ...args);
	}

	throw new Error('Unsupported event bind on given object');
}
