
import querySelectorAll from './querySelectorAll'

const internalSelector = {};


export function bindInternalSelector(selector, plugin)
{
	internalSelector[selector] = internalSelector[selector] || [];
	internalSelector[selector].push(plugin);

	return function() {
		internalSelector[selector].splice(internalSelector[selector].indexOf(plugin), 1);
	}
}


export function loadInternalSelector($dom, options)
{
	Object.keys(internalSelector).forEach(function(selector) {
		querySelectorAll($dom, selector).forEach(function($node) {
			internalSelector[selector].forEach(plugin => plugin($node, {...options}));
		});
	});
}
