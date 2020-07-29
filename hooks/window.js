
import { rect } from 'appgine/closure'
import { withModuleContext } from 'appgine/hooks'
import { useContext, bindContext } from 'appgine/hooks'
import { useEvent } from 'appgine/hooks/event'
import createConnector from 'appgine/addons/createConnector'

const connector = createConnector();

let currentTop;
let currentLeft;
let currentHeight;
let currentWidth;
let currentScrollTop;
let currentScrollLeft;
let currentScrollHeight;
let currentScrollWidth;

withModuleContext(module, function() {
	useEvent(window, 'scroll', onWindowScroll);
	useEvent(window, 'resize', onWindowResize);
});

export function useChange(fn, immediatelly=true) {
	return useContext(context => {
		const handler = connector.connect();
		handler.then(fn);
		immediatelly && handler.resolve(currentScreen(), true);

		return handler;
	});
}

export function scrollZero() {
	scrollTo(0, 0);
}

export function scrollOffset(offsetLeft, offsetTop) {
	tryWindowUpdate();
	scrollTo(currentScrollLeft+offsetLeft, currentScrollTop+offsetTop);
}

export function scrollTo(newScrollLeft, newScrollTop) {
	windowReset();
	window.scrollTo(newScrollLeft, newScrollTop);
}

export function scrollTop() {
	tryWindowUpdate();
	return currentScrollTop;
}

export function scrollLeft() {
	tryWindowUpdate();
	return currentScrollLeft;
}

export function currentScreen() {
	tryWindowUpdate();
	return {
		top: currentTop, left: currentLeft, height: currentHeight, width: currentWidth,
		scrollTop: currentScrollTop, scrollLeft: currentScrollLeft,
		scrollHeight: currentScrollHeight, scrollWidth: currentScrollWidth,
	};
}

function onWindowScroll(e) {
	windowReset();
	connector.forEach(handler => handler.resolve(currentScreen(), false));
}

function onWindowResize(e) {
	windowReset();
	connector.forEach(handler => handler.resolve(currentScreen(), true));
}

function tryWindowUpdate() {
	currentScrollTop===undefined && windowUpdate();
}

const doc = document;
const docEl = doc.documentElement||{};
const docClient = doc.compatMode == 'CSS1Compat' ? doc.documentElement : doc.body;

function windowReset() {
	currentScrollTop = currentScrollLeft = currentScrollHeight = currentScrollWidth = undefined;
}

function windowUpdate() {
	currentTop = Math.max(window.pageYOffset||0, window.scrollY||0, doc.body.scrollTop||0, docEl.scrollTop||0)
	currentLeft = Math.max(window.pageXOffset||0, window.scrollX||0, doc.body.scrollLeft||0, docEl.scrollLeft||0);
	currentHeight = docClient.clientHeight;
	currentWidth = docClient.clientWidth;
	currentScrollTop = currentTop;
	currentScrollLeft = currentLeft;
	currentScrollHeight = Math.max(doc.body.scrollHeight||0, docEl.scrollHeight||0) - currentHeight;
	currentScrollWidth = Math.max(doc.body.scrollWidth||0, docEl.scrollWidth||0) - currentWidth;
}

