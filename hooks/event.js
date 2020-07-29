
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
