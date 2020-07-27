
import * as tick from '../src/tick'
import { useContext, bindContext } from 'appgine/hooks'


export function useTick(fn) {
	fn = bindContext(fn);
	return useContext(context => tick.onTick(context.$element, fn));
}


export function useOnceTick(fn) {
	fn = bindContext(fn);
	return useContext(context => tick.onceTick(context.$element, fn));
}


export function useImmediateTick(fn) {
	fn = bindContext(fn);
	return useContext(context => tick.onImmediateTick(context.$element, fn));
}


export function useEachTick(fn) {
	fn = bindContext(fn);
	return useContext(context => tick.onEachTick(context.$element, fn));
}
