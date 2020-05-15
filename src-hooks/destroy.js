
import { useContext } from 'appgine/hooks'


export function useDestroy(fn) {
	return useContext(() => fn);
}

