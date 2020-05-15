
import parser from './parser'
import { loadData } from '../loader/scripts'


export default function resolveDataAttribute($element, attrName, fn) {
	for (let plugin of parser($element.getAttribute(attrName)||'')) {
		plugin.createData = function() {
			if (String($element.tagName||'').toLowerCase()==='script' && plugin.pluginVar==='') {
				try { return JSON.parse($element.textContent); } catch (e) {}
				return null;
			}

			return loadData(plugin.pluginVar);
		}

		fn({...plugin});
	}
}
