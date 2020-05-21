
import * as errorhub from '../errorhub'

const contextStack = [];
const contextList = [];


export default function withContext(...contextArgs) {
	const fn = contextArgs.pop();
	const redbox = (process.env.NODE_ENV !== 'production') ? require('./lib/redbox').createRedBox() : null;
	const context = { contextArgs, destroy: [], redbox };

	contextList.push(context);
	context.destroy.push({current: internalWithContext(context, fn, [])});

	return function() {
		context.redbox && context.redbox.destroy();
		context.destroy.splice(0, context.destroy.length).reverse().forEach(processDestroy);

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
	const context = contextStack[contextStack.length-1];

	if (!context) {
		renderError(errorhub.ERROR.CONTEXT, new Error('missing content in fn call'), 'failed context function', fn.toString())
	}

	const destroy = {current: null};
	function internalUse(...args) {
		destroy.current && withDestroy && internalDestroy();
		destroy.current = context && internalWithContext(context, fn, args);
		return internalDestroy;
	}

	function internalDestroy() {
		processDestroy(destroy);
	}

	context && context.destroy.push(destroy);

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
		renderError(errorhub.ERROR.CONTEXT, new Error('missing content in useContext call'), 'failed context function', fn.toString());
		return function() {};
	}

	const destroy = {current: fn(...contextStack[contextStack.length-1].contextArgs)};
	function internalDestroy() {
		processDestroy(destroy);
	}

	contextStack[contextStack.length-1].destroy.push(destroy);
	return internalDestroy;
}


export function withErrorCatch(errormsg, tryFn, args=[])
{
	try {
		return tryFn(...args);

	} catch (e) {
		contextStack.length && contextStack[contextStack.length-1].redbox && contextStack[contextStack.length-1].redbox.render(e);
		errorhub.dispatch(errorhub.ERROR.PLUGINS, errormsg, e, tryFn.toString());

		if (process.env.NODE_ENV !== 'production') {
			console.log(tryFn, ...args);
		}
	}
}


function internalWithContext(context, fn, args) {
	try {
		contextStack.push(context);
		const destroy = fn(...args);
		contextStack.pop();
		return destroy;

	} catch (e) {
		contextStack.pop();
	}
}


function processDestroy(destroy) {
	try {
		(typeof destroy.current==='function') && destroy.current();
	} catch (e) {
		renderError(errorhub.ERROR.DESTROY, e, 'failed destroy function', destroy.current.toString());

	} finally {
		destroy.current = null;
	}
}


function renderError(errorcode, e, ...debug) {
	if (process.env.NODE_ENV !== 'production') {
		try {
			const redbox = require('./lib/redbox').createRedBox();
			redbox.render(e);
			setTimeout(() => redbox.destroy(), 5000);

		} catch (e) {}
	}

	errorhub.dispatch(errorcode, e, ...debug);
}
