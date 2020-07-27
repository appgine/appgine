
import { onReload, onRedirect, scroll } from '../src/engine/run'


export function useRedirect(endpoint) {
	return useContext(context => { onRedirect(context.$element, endpoint) });
}


export function useReload() {
	onReload();
}


export function useScroll($element, animated) {
	return useContext(context => { scroll(context.$element || $element, animated); });
}
