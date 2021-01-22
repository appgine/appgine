
import * as formData from 'appgine/utils/formData'


let currentLink = new URL(window.location.href);

let _ignoreURIParams = [];
export function ignoreURIParams(ignoreURIParams) {
	_ignoreURIParams = ignoreURIParams;
}


export function change(location) {
	currentLink = new URL(location, currentLink);
	handleIgnoreURIParams(currentLink);
	return currentLink.toString();
}


export function getHash(location) {
	return (new URL(location, currentLink)).hash;
}


export function getQueryKeys(location) {
	return createUri(location).searchParams.keys();
}


export function sameOrigin(location) {
	return currentLink.hostname===(new URL(location, currentLink)).hostname;
}


export function areSame(location1, location2) {
	return createCanonical(location1)===createCanonical(location2);
}


export function isSame(location) {
	return createCanonical(currentLink)===createCanonical(location);
}


export function createCanonical(location, allowHash) {
	const uri = (new URL(location, currentLink));
	handleIgnoreURIParams(uri);
	uri.hash = allowHash===true ? uri.hash : '';
	return uri.toString();
}


export function canonical(location, params, hash) {
	const uri = createUri(location, params, hash);
	const searchParams = new URLSearchParams();

	for (let [key, val] of createUri().searchParams.entries()) {
		if (uri.searchParams.has(key)) {
			searchParams.set(key, uri.searchParams.get(key));
		}
	}

	for (let [key, val] of uri.searchParams.entries()) {
		if (searchParams.has(key)===false) {
			searchParams.set(key, val);
		}
	}

	uri.search = searchParams.toString();
	return uri.toString();
}


export function createFormAction($form) {
	const formMethod = String($form.method||'').toUpperCase();
	return createUri($form.getAttribute('action'), formMethod!=='GET', $form.getAttribute('action') ? undefined : '').toString();
}


export function createForm($form, $submitter) {
	const method = ($submitter && $submitter.getAttribute('formmethod') || $form.getAttribute('method') || 'GET').toUpperCase();
	const action = $submitter && $submitter.getAttribute('formaction') || $form.getAttribute('action');
	const params = method==='GET' ? formData.queryData($form, $submitter) : true;
	const hash = action ? undefined : '';

	return create(action, params, hash);
}


export function createReport(location, params) {
	const uri = createUri(location, params);
	return '/' + uri.pathname.replace(/^\//, '') + uri.search;
}


export function create(location, params, hash) {
	return createUri(location, params, hash).toString();
}


function createUri(location, params, hash) {
	if (location && typeof location === 'object') {
		params = location;
		location = '';
	}

	const uri = new URL(location||'', currentLink);

	if (params===false) {
		uri.search = '';

	} else if (typeof params==='string') {
		uri.search = params;

	} else if (params instanceof URLSearchParams) {
		uri.search = params.toString();

	} else if (typeof params === 'object') {
		for (let key of Object.keys(params||{})) {
			uri.searchParams.set(key, params[key]);
		}
	}

	handleIgnoreURIParams(uri);

	if (typeof hash==='string') {
		uri.hash = hash;

	} else if (hash===true) {
		uri.hash = currentLink.hash.substr(1);
	}

	return uri;
}


function handleIgnoreURIParams(uri)
{
	if (uri.search) {
		if (typeof _ignoreURIParams==='string') {
			uri.searchParams.delete(_ignoreURIParams);

		} else if (Array.isArray(_ignoreURIParams)) {
			_ignoreURIParams.forEach(key => uri.searchParams.delete(key));
		}
	}
}
