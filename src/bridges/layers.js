
import closure from '../closure'
import * as history from '../engine/history'
import { requestStack } from '../engine/run'


export default function bridgeLayers(options={}, render) {
	require('../plugins').loader(function({ bind, bindApi }) {
		bindApi('request', require('../api/request').default);
		bindApi('targets', require('../api/targets').default);
		bindApi('shortcut', require('../api/shortcut').default);

		bind('app.layers', require('./layers.plugin').createLayer);
		bind('app.layers.navigation', require('./layers.plugin').createNavigation);
	});

	const { initRequest } = options;

	options.initRequest = function(request) {
		initRequest && initRequest(request);

		request._layers = {};
		request._layersActive = {};

		Array.from(request.$fragment.querySelectorAll('[data-layer]')).forEach(function($layer) {
			const dataLayer = $layer.getAttribute('data-layer')||'';
			const [layerId, route, routeId] = dataLayer.split('#').concat("", "");
			const isAutoLayer = $layer.hasAttribute('layer-auto') && $layer.getAttribute('layer-auto')!=="0";

			$layer.removeAttribute('data-layer');
			$layer.removeAttribute('layer-auto');

			const $navigationList = {};
			const $title = $layer.querySelector(':not([data-layer]) [layer-title]');

			if ($title) {
				$title.parentNode.removeChild($title);
				$title.removeAttribute('layer-title');
			}

			Array.from($layer.querySelectorAll(':not([data-layer]) [layer-content] [layer-navigation]')).forEach(function($element) {
				const { route, $navigation } = createNavigation($element, false);
				$navigationList[route] = $navigation;
			});

			Array.from($layer.querySelectorAll(':not([data-layer]) [layer-navigation]')).forEach(function($element) {
				const { route, $navigation } = createNavigation($element, true);
				$navigationList[route] = $navigation;
			});

			request._layers[layerId] = { route, routeId, isAutoLayer, $title, $navigationList };

			const $content = $layer.querySelector(':not([data-layer]) [layer-content]');

			if ($content) {
				$content.parentNode.removeChild($content);
				$content.removeAttribute('layer-content');
			}

			let { $titles, $navigation } = createLayers(request, layerId);
			let result = render($layer, $titles, $navigation, $content);

			if (result instanceof Element) {
				result = { $container: result };

			} else {
				result = result || {};
			}

			if (result.$navigation) {
				$navigation = result.$navigation;
			}

			if ($navigation) {
				const pluginData = JSON.stringify([String(result.navigationActive||''), String(result.toggleActive||'')]);
				$navigation.setAttribute('data-plugin', 'app.layers.navigation:'+pluginData+'$' + String($navigation.getAttribute('data-plugin')||''));

				if (result.$toggle) {
					result.$toggle.setAttribute('data-target', 'toggle@app.layers.navigation');
				}
			}

			const $newLayer = result.$container || $layer;
			$newLayer.setAttribute('data-layer', dataLayer);
			$newLayer.setAttribute('data-plugin', 'app.layers:'+String(layerId)+'$' + String($newLayer.getAttribute('data-plugin')||''));
			$layer.parentNode.replaceChild($newLayer, $layer);
		});
	}

	return options;
}


function createNavigation($element, remove) {
	const route = $element.getAttribute('layer-navigation')||'';
	$element.removeAttribute('layer-navigation');

	remove && $element.parentNode.removeChild($element);

	const $navigation = $element.cloneNode(true);
	return { route, $navigation }
}


function createLayers(request, layerId) {
	const requestChain = createLayersChain(request, layerId, history.getCurrentTree().slice(0, -1));

	let chain = [];
	let chainNav = [];

	for (let i=0; i<requestChain.length; i++) {
		const { isAutoLayer, route, routeId } = requestChain[i].requestLayer;

		for (let j=0; j<chain.length; j++) {
			const { route: _route, routeId: _routeId } = requestChain[chain[j]].requestLayer;

			if (_route===route && _routeId===routeId) {
				chain = chain.slice(0, j);
				break;
			}
		}

		const last = chain.pop();

		if (last===undefined) {
			chain.push(i);

		} else {
			const navigationRoute = findRequestNavigation(requestChain[last].requestLayer, route);

			if (navigationRoute) {
				chainNav[i] = last;
				chain.push(last, i);

			} else if (chainNav[last]!==undefined && chainNav[last]!==last) {
				const sharedNavigationRoute = findRequestNavigation(requestChain[chainNav[last]].requestLayer, route);

				if (sharedNavigationRoute) {
					chainNav[i] = chainNav[last];
					chain.push(i);
				}
			}

			if (chain.indexOf(i)===-1) {
				if (isAutoLayer) {
					chainNav[i] = undefined;
					chain.push(last, i);

				} else {
					chain = [];
				}
			}
		}
	}

	const $titles = [];
	let $navigation = null;

	for (let i=0; i<chain.length-1; i++) {
		const { back, requestLayer } = requestChain[chain[i]];

		let $title = null;
		if (requestLayer.$title) {
			$title = requestLayer.$title.cloneNode(true);
			$title.dataset.target = 'title@app.layers:'+String(back)+'$';
		}

		$titles.push($title);
	}

	const chainLast = chain[chain.length-1];

	if (chainNav[chainLast]!==undefined) {
		const navigationLayer = requestChain[chainNav[chainLast]].requestLayer;
		const navigationRoute = findRequestNavigation(navigationLayer, requestChain[chainLast].requestLayer.route);

		if (navigationRoute) {
			$navigation = navigationLayer.$navigationList[navigationRoute].cloneNode(true);
		}
	}

	return { $titles, $navigation };
}


function createLayersChain(request, layerId, requestTree) {
	if (!request) {
		return [];
	}

	const back = requestTree.length;
	const requestLayer = request._layers[layerId];
	const requestChain = { back, requestLayer };

	const historyRequest = requestStack.loadHistoryRequest(requestTree.pop());

	if (historyRequest) {
		const historyLayer = historyRequest._layers[layerId];
		const historyActive = (historyRequest._layersActive||{})[layerId];

		if (historyLayer && historyActive!==false) {
			return createLayersChain(historyRequest, layerId, requestTree).concat(requestChain);
		}
	}

	return [requestChain];
}


function findRequestNavigation(requestLayer, route) {
	for (let navigationRoute of Object.keys(requestLayer.$navigationList)) {
		if (isRouteValid(route, navigationRoute)) {
			return navigationRoute;
		}
	}
}


function isRouteValid(requestRoute, navigationRoute) {
	requestRoute = String(requestRoute||'');
	requestRoute = requestRoute.replace(/^\s*:+/, '');
	requestRoute = requestRoute.replace(/\s+$/, '');

	navigationRoute = String(navigationRoute||'');
	navigationRoute = navigationRoute.replace(/^\s+/, '');
	navigationRoute = navigationRoute.replace(/\s+$/, '');

	const requestRouteParts = requestRoute.split(':');

	const routes = [];
	if (navigationRoute[0]===":") {
		routes.push(navigationRoute.substr(1));

	} else {
		for (let i=0; i<requestRouteParts.length; i++) {
			routes.push([].concat(requestRouteParts.slice(0, i+1), navigationRoute).join(':'));
		}
	}

	if (routes.indexOf(requestRoute)!==-1) {
		return true;
	}

	for (let i=0; i<requestRouteParts.length; i++) {
		const requestRouteAsterisk = [].concat(requestRouteParts.slice(0, i), '*', requestRouteParts.slice(i+1)).join(':');

		if (routes.indexOf(requestRouteAsterisk)!==-1) {
			return true;
		}
	}

	return false;
}
