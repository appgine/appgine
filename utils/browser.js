

const isChromium = window.chrome;
const winNav = window.navigator;
const vendorName = winNav.vendor;
const isOpera = typeof window.opr !== "undefined";
const isIEedge = winNav.userAgent.indexOf("Edge") > -1;
const isIOSChrome = winNav.userAgent.match("CriOS");
const isFirefoxBrowser = winNav.userAgent.indexOf("firefox") > -1;
const isFxiOS = winNav.userAgent.indexOf("FxiOS") > -1;


export function isChrome() {
	if (isIOSChrome) {
		return true;
	}

	if (
		isChromium !== null &&
		typeof isChromium !== "undefined" &&
		vendorName === "Google Inc." &&
		isOpera === false &&
		isIEedge === false
	) {
		return true;
	}

	return false;
}


export function isFirefox() {
	return isFirefoxBrowser || isFxiOS;
}
