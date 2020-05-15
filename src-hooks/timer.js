
import { useContext, bindContextWithDestroy } from 'appgine/hooks'


export function useTimeout(fn, timeout) {
	return useContext(function() {
		let pointer = setTimeout(fn, timeout)
		return () => clearTimeout(pointer);
	});
}


export function bindTimeout() {
	return bindContextWithDestroy(useTimeout);
}
