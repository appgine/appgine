

const contextStack = [];
const contextList = [];


export default function withContext(...contextArgs) {
	const fn = contextArgs.pop();
	const context = { contextArgs, destroy: [] };
	contextList.push(context);
	context.destroy.push(internalWithContext(context, fn, []));

	return function() {
		context.destroy.splice(0, context.destroy.length).reverse().filter(fn => typeof fn==='function').forEach(fn => {
			try {
				fn();
			} catch (e) {
				console.log('failed to destroy', e, fn);
			}
		});

		if (contextList.indexOf(context)!==-1) {
			contextList.splice(contextList.indexOf(context), 1);
		}
	}
}


export function withModuleContext(module, fn) {
	const handler = withContext(fn);

	if (module && module.hot) {
		module.hot.dispose(handler);
	}

	return handler;
}


export function bindContextWithDestroy(fn) {
	return internalBindContext(fn, true);
}


export function bindContext(fn) {
	return internalBindContext(fn, false);
}


function internalBindContext(fn, withDestroy) {
	if (contextStack.length===0) {
		throw new Error('Missing context in call');
	}

	const context = contextStack[contextStack.length-1];
	let destroy = null;

	function internalUse(...args) {
		destroy && withDestroy && destroy();
		destroy = internalWithContext(context, fn, args);
		return destroy;
	}

	function internalDestroy() {
		(typeof destroy==='function') && destroy();
		destroy = null;
	}

	context.destroy.push(internalDestroy);

	internalUse[0] = internalUse;
	internalUse[1] = internalDestroy;
	internalUse[Symbol.iterator] = function *() {
		yield internalUse;
		yield internalDestroy;
	}

	return internalUse;
}


export function useContext(fn) {
	if (contextStack.length===0) {
		throw new Error('Missing context in call');
	}

	let destroy = fn(...contextStack[contextStack.length-1].contextArgs);
	function internalDestroy() {
		(typeof destroy==='function') && destroy();
		destroy = null;
	}

	contextStack[contextStack.length-1].destroy.push(internalDestroy);
	return internalDestroy;
}


function internalWithContext(context, fn, args) {
	try {
		contextStack.push(context);
		const destroy = fn(...args);
		contextStack.pop();
		return destroy;

	} catch (e) {
		console.log('fail to create', e);
		contextStack.pop();
	}
}
