
import { reloadPlugins } from '../engine/plugins'


const api = {
	reloadPlugins($element, itself) {
		itself = $element===true || itself;
		$element = $element instanceof Element && $element || null;
		reloadPlugins($element||this.$element, itself ? undefined : this.pluginObj);
	}
}

export default api;
