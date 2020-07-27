
import parser from './parser'
import { loadData } from '../loader/scripts'


export default function resolveDataAttribute($element, attrName, fn) {
	return parser($element.getAttribute(attrName)||'').map(plugin => {
		plugin = {...plugin};
		plugin.createData = function() {
			if (String($element.tagName||'').toLowerCase()==='script' && plugin.pluginVar==='') {
				try { return JSON.parse($element.textContent); } catch (e) {}
				return null;
			}

			return loadData(plugin.pluginVar);
		}

		fn && fn(plugin);
		return plugin;
	});
}
