
import * as errorhub from '../../errorhub'
import querySelectorAll from '../lib/querySelectorAll'


const loaded = {};


export function loadScripts($dom)
{
	querySelectorAll($dom, 'script[type^="data-plugin/"]').forEach(function($script) {
		const pluginVar = ($script.getAttribute('type')||'').replace(/data-plugin\//, '');
		loaded[pluginVar] = $script.textContent;
	});
}


export function unloadScripts($dom)
{
	querySelectorAll($dom, 'script[type^="data-plugin/"]').forEach(function($script) {
		const pluginVar = ($script.getAttribute('type')||'').replace(/data-plugin\//, '');
		delete loaded[pluginVar];
	});
}


export function loadData(pluginVar)
{
	try {
		return JSON.parse(loaded[pluginVar] || pluginVar || JSON.stringify(null));

	} catch (e) {
		loaded[pluginVar] && errorhub.dispatch(errorhub.ERROR.LOADDATA, 'Failed loaddata', e, pluginVar);
		return pluginVar;
	}
}
