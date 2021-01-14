
import querySelectorAll from '../src/plugins/lib/querySelectorAll'
import resolveDataAttribute from '../src/plugins/lib/resolveDataAttribute'

import { dom } from 'appgine/closure'
import withContext from 'appgine/hooks'
import { useContext, withErrorCatch } from 'appgine/hooks'

let transactions = 0;
let transactionHandling = false;
let transactionTimeout = null;
let transactionPlugins = [];
let transactionChanged = false;
let transactionComplete = false;

const containerPointer = [];
const containerNodes = [];
const internalPlugins = [];
const internalComplete = [];
let internalTargets = [];

const useSelectorPointer = {};
const useSelectorAttr = {};
addInternalSelector('[data-target]', true);

function transactionEnd() {
	clearTimeout(transactionTimeout);
	transactionTimeout = null;

	if (transactionHandling) {
		return;
	}

	transactionHandling = true;

	while(transactions===0 && transactionPlugins.length) {
		const plugin = transactionPlugins.pop();

		if (plugin.$element.ownerDocument!==document) {
			continue;
		}

		for (let target of internalTargets) {
			if (target.$element.ownerDocument!==document) {
				continue
			}

			if (plugin.first && plugin.targets.length>0) {
				break;
			}

			internalCompletePluginTarget(plugin, target);
		}
	}

	if (transactions===0 && transactionChanged) {
		transactionChanged = false;
		transactionHandling = false;
		transactionPlugins = [...internalPlugins].reverse();
		transactionEnd();
		return;
	}

	if (transactions===0 && transactionComplete===false) {
		transactionComplete = [...internalComplete].reverse();
	}

	while (transactions===0 && Array.isArray(transactionComplete) && transactionComplete.length) {
		const plugin = transactionComplete.pop();

		if (plugin.$element.ownerDocument===document) {
			internalCompletePlugin(plugin);
		}
	}

	if (transactions===0 && Array.isArray(transactionComplete)) {
		transactionComplete = true;
	}

	transactionHandling = false;
}

export function transaction(fn) {
	transactions++;
	withErrorCatch('targets.transaction', fn);
	transactions--;
	transactionEnd();
}


export function swapDocument(fn)
{
	transaction(function() {
		uncompleteTargets();

		removeContainer('document', document);
		withErrorCatch('targets.swapDocument', fn);
		addContainer('document', document);

		transactionChanged = false;
		transactionPlugins = [...internalPlugins].reverse();
	});
}


export function removeElement($element)
{
	uncompleteTargets();

	const removed = [];
	internalTargets = internalTargets.filter(target => {
		if (dom.contains($element, target.$element)) {
			removed.push(target);
			return false;
		}

		return true;
	});

	if (removed.length) {
		for (let plugin of internalPlugins) {
			for (let i=plugin.targets.length; i>0; i--) {
				if (removed.indexOf(plugin.targets[i-1])!==-1) {
					plugin.contexts[i-1] && plugin.contexts[i-1]();
					plugin.contexts.splice(i-1, 1);
					plugin.targets.splice(i-1, 1);
				}
			}
		}
	}
}


export function addElement($element)
{
	uncompleteTargets();

	for (let selector of Object.keys(useSelectorPointer)) {
		for (let pointer=0; pointer<containerPointer.length; pointer++) {
			if (containerPointer[pointer]!==undefined) {
				for (const $containerNode of containerNodes[pointer]) {
					if (dom.contains($containerNode, $element)) {
						addSelectorWithContainer(selector, useSelectorAttr[selector], containerPointer[pointer], $element);
					}
				}
			}
		}
	}
}


export function useTarget(target, fn) {
	const plugin = { first: true, target };
	return internalPluginTargets(plugin, fn);
}


export function useTargets(target, fn) {
	const plugin = { first: false, target };
	return internalPluginTargets(plugin, fn);
}


export function useFirstSelector(selector, fn) {
	const plugin = { first: true, selector };
	addInternalSelector(selector, false);
	return internalPluginTargets(plugin, fn, () => removeInternalSelector(selector));
}


export function useSelector(selector, fn) {
	const plugin = { first: false, selector };
	addInternalSelector(selector, false);
	return internalPluginTargets(plugin, fn, () => removeInternalSelector(selector));
}


function addInternalSelector(selector, allowAttr) {
	useSelectorPointer[selector] = useSelectorPointer[selector] || 0;
	useSelectorAttr[selector] = allowAttr && (selector.match(/\[([a-zA-Z0-9-]+)]$/)||[])[1] || null;

	if (++useSelectorPointer[selector]===1) {
		for (let pointer=0; pointer<containerPointer.length; pointer++) {
			if (containerPointer[pointer]!==undefined) {
				for (const $containerNode of containerNodes[pointer]) {
					addSelectorWithContainer(selector, useSelectorAttr[selector], containerPointer[pointer], $containerNode);
				}
			}
		}
	}
}


function removeInternalSelector(selector) {
	if (--useSelectorPointer[selector]===0) {
		delete useSelectorPointer[selector];
		delete useSelectorAttr[selector];
		internalTargets = internalTargets.filter(target => target.selector!==selector)
	}
}


function internalPluginTargets(plugin, fn, whenDispose) {
	plugin.fn = fn || (_ => _);
	plugin.containers = [];
	plugin.results = [];
	plugin.targets = [];
	plugin.contexts = [];

	uncompleteTargets();

	useContext(context => {
		if (context.$element) {
			plugin.context = context;
			plugin.$element = context.$element;

			internalPlugins.push(plugin);
			transactionPlugins.push(plugin);

			pointer:
			for (let pointer=0; pointer<containerPointer.length; pointer++) {
				if (containerPointer[pointer]!==undefined) {
					for (const $containerNode of containerNodes[pointer]) {
						if (dom.contains($containerNode, plugin.$element)) {
							plugin.containers.push(containerPointer[pointer]);
							continue pointer;
						}
					}
				}
			}

			return function() {
				uncompleteTargets();

				if (internalPlugins.indexOf(plugin)!==-1) {
					internalPlugins.splice(internalPlugins.indexOf(plugin), 1);
				}

				plugin.results.splice(0, plugin.results.length);
				plugin.targets.splice(0, plugin.targets.length);
				plugin.contexts.splice(0, plugin.contexts.length).forEach(context => context && context());

				whenDispose && whenDispose();
			}
		}
	});

	return plugin.results;
}


export function useComplete(fn) {
	const plugin = { completeContext: null, fn }

	useContext(context => {
		if (context.$element) {
			plugin.context = context;
			plugin.$element = context.$element;

			internalComplete.push(plugin);

			if (transactionComplete===true) {
				transactionComplete = [];
			}

			if (Array.isArray(transactionComplete)) {
				transactionComplete.push(plugin);
			}

			if (transactions===0) {
				transactionTimeout = transactionTimeout || setTimeout(transactionEnd, 0);
			}

			return function() {
				if (internalComplete.indexOf(plugin)!==-1) {
					internalComplete.splice(internalComplete.indexOf(plugin), 1);
				}

				if (Array.isArray(transactionComplete)) {
					if (transactionComplete.indexOf(plugin)!==-1) {
						transactionComplete.splice(transactionComplete.indexOf(plugin), 1);
					}
				}

				plugin.completeContext && plugin.completeContext();
				plugin.completeContext = null;
			}
		}
	});
}


export function addContainer(container, $node) {
	if (containerPointer.indexOf(container)===-1) {
		containerPointer.push(container);
		containerNodes.push([]);
	}

	containerNodes[containerPointer.indexOf(container)].push($node);

	for (let plugin of internalPlugins) {
		if (plugin.containers.indexOf(container)===-1) {
			if (dom.contains($node, plugin.$element)) {
				plugin.containers.push(container);
			}
		}
	}

	for (let selector of Object.keys(useSelectorPointer)) {
		addSelectorWithContainer(selector, useSelectorAttr[selector], container, $node);
	}
}


export function removeContainer(container, $node) {
	let pointer = containerPointer.indexOf(container);

	if (pointer===-1) {
		return;
	}

	uncompleteTargets();

	if (containerNodes[pointer].indexOf($node)!==-1) {
		containerNodes[pointer].splice(containerNodes[pointer].indexOf($node), 1);
	}

	for (let target of internalTargets) {
		if (target.containers.indexOf(container)!==-1) {
			if (containerNodes[pointer].length===0 || dom.contains($node, target.$element)) {
				target.containers.splice(target.containers.indexOf(container), 1);
			}
		}
	}

	for (let plugin of internalPlugins) {
		if (plugin.containers.indexOf(container)!==-1) {
			if (containerNodes[pointer].length===0 || dom.contains($node, plugin.$element)) {
				plugin.containers.splice(plugin.containers.indexOf(container), 1);
			}
		}

		for (let i=plugin.targets.length; i>0; i--) {
			if (plugin.containers.length>0 && plugin.targets[i-1].containers.length>0 && plugin.containers.some(container => plugin.targets[i-1].containers.indexOf(container)!==-1)) {
				continue;
			}

			plugin.contexts[i-1] && plugin.contexts[i-1]();
			plugin.targets.splice(i-1, 1);
			plugin.contexts.splice(i-1, 1);
		}
	}

	internalTargets = internalTargets.filter(target => target.containers.length>0);

	if (containerNodes[pointer].length===0) {
		containerPointer[pointer] = undefined;
	}
}


function addSelectorWithContainer(selector, attr, container, $node) {
	querySelectorAll($node, selector).forEach(function($element) {
		let found = false;
		for (let target of internalTargets) {
			if (target.$element===$element && target.selector===selector) {
				found = true;
				if (target.containers.indexOf(container)===-1) {
					target.containers.push(container);
				}
			}
		}

		if (found===false) {
			const targets = attr ? resolveDataAttribute($element, attr) : [{}];

			for (let target of targets) {
				target.selector = selector;
				target.$element = $element;
				target.containers = [container];
				transactionChanged = true;
				internalTargets.push(target);
			}
		}
	});
}


function uncompleteTargets()
{
	if (transactionComplete!==false) {
		const completing = transactionComplete!==true;
		transactionComplete = false;

		for (let complete of internalComplete) {
			complete.completeContext && complete.completeContext();
			complete.completeContext = null;
		}

		if (completing) {
			if (process.env.NODE_ENV !== 'production') {
				throw new Error('No changes are allowed while completing target DOM.');
			}
		}
	}

	if (transactions===0) {
		transactionTimeout = transactionTimeout || setTimeout(transactionEnd, 0);
	}
}


function internalCompletePlugin(plugin) {
	if (plugin.completeContext===null) {
		plugin.completeContext = withContext({}, () => withErrorCatch('useComplete', plugin.fn));
	}
}


function internalCompletePluginTarget(plugin, target) {
	if (plugin.targets.indexOf(target)!==-1) {
		return;
	}

	if (plugin.selector) {
		if (plugin.selector!==target.selector) {
			return;
		}

	} else if (matchTargetPlugin(plugin.context, target)===false) {
		return;

	} else if (matchTarget(plugin.target, target.target)===false) {
		return;
	}

	const contextArgs = [target.$element, {...target, data: target.createData ? target.createData() : null}];
	const context = withContext(target, function() {
		const result = withErrorCatch('useTargets', plugin.fn, contextArgs);

		if (result!==undefined) {
			plugin.results.push(result);
		}

		return function() {
			if (plugin.results.indexOf(result)!==-1) {
				plugin.results.splice(plugin.results.indexOf(result), 1);
			}
		}
	});

	plugin.targets.push(target);
	plugin.contexts.push(context);
}


function matchTargetPlugin(plugin, target) {
	return plugin.name===target.name || (target.pluginName==='this' && dom.contains(plugin.$element, target.$element));
}


function matchTarget(pluginTarget, target) {
	return (pluginTarget==='' || pluginTarget===target || (Array.isArray(pluginTarget) && pluginTarget.indexOf(target)!==-1));
}
