
import closure from 'appgine/closure'
import * as history from 'appgine/src/engine/history'
import { requestStack } from 'appgine/src/engine/run'


export default function bridgeLayers(options={}, render) {
	require('../plugins').loader(function({ bind, bindApi }) {
		bindApi('request', require('../api/request').default);
		bindApi('targets', require('../api/targets').default);
		bindApi('shortcut', require('../api/shortcut').default);

		bind('app.layers', require('./layers.plugin').createLayer);
		bind('app.layers.navigation', require('./layers.plugin').createNavigation);
	});

	const { initRequest, onAfterSwap } = options;

	function runAnimation(animation) {
		animation && closure.animation.animateOnce(animation[0], animation[1]);
	}

	options.onAfterSwap = function(requestFrom, requestTo) {
		onAfterSwap && onAfterSwap(requestFrom, requestTo);

		if (requestFrom && requestTo) {
			for (let layerId of Object.keys(requestFrom._layersDefinition)) {
				const layerFrom = requestFrom._layersDefinition[layerId];
				const layerTo = requestTo._layersDefinition[layerId];

				if (layerFrom && layerTo) {
					const chainFrom = layerFrom.layersChain;
					const chainTo = layerTo.layersChain;

					const { animations={} } = layerTo.result;

					if (chainTo.length>chainFrom.length) {
						runAnimation(animations.newLayer);
						runAnimation(animations.newNavigation);

					} else if (chainTo.length===chainFrom.length) {
						if (requestFrom._layers[layerId].routeId===requestTo._layers[layerId].routeId) {
							runAnimation(animations.samePage);

						} else {
							runAnimation(animations.sameLayer);
						}

					} else {
						runAnimation(animations.oldLayer);
					}
				}
			}
		}
	}

	options.initRequest = function(request) {
		initRequest && initRequest(request);

		request._layers = {};
		request._layersActive = {};
		request._layersDefinition = {};

		Array.from(request.$fragment.querySelectorAll('[data-layer]')).forEach(function($layer) {
			const dataLayer = $layer.getAttribute('data-layer')||'';
			const [layerId, route, routeId] = dataLayer.split('#').concat("", "");
			const layerMode = parseInt($layer.getAttribute('layer-auto') || $layer.getAttribute('layer-mode'), 10) || 0;
			const layerExit = parseInt($layer.getAttribute('layer-exit'), 10) || 0;
			const endpoint = request.endpoint;
			const endpointArgs = closure.uri.getQueryKeys(endpoint);

			$layer.removeAttribute('data-layer');
			$layer.removeAttribute('layer-mode');
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

			request._layers[layerId] = { route, routeId, layerMode, layerExit, endpoint, endpointArgs, $title, $navigationList };

			const $content = $layer.querySelector(':not([data-layer]) [layer-content]');

			if ($content) {
				$content.parentNode.removeChild($content);
				$content.removeAttribute('layer-content');
			}

			const layersChain = createLayersChain(request, layerId);
			let $titles = createLayersTitle(layersChain);
			let $navigation = createLayersNavigation(layersChain);

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

			request._layersDefinition[layerId] = {
				layersChain, result
			};
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


function createLayersChain(request, layerId) {
	const requestChain = createRequestChain(request, layerId, history.getCurrentTree().slice(0, -1));

	let chain = [];
	let chainNav = [];
	let inLayerAutoMode = false;

	for (let i=0; i<requestChain.length; i++) {
		const requestLayer = requestChain[i].requestLayer;
		const { layerMode, route, routeId } = requestLayer;

		for (let j=0; j<chain.length; j++) {
			const { route: _route, routeId: _routeId } = requestChain[chain[j]].requestLayer;

			if (_route===route && _routeId===routeId) {
				chain = chain.slice(0, j);
				break;
			}
		}

		const last = chain.pop();

		if (layerMode<0) {
			chain = [];

		} else if (last===undefined) {
			chain.push(i);

		} else {
			const navigationRoute = findRequestNavigation(requestChain[last].requestLayer, requestLayer);

			if (navigationRoute) {
				chainNav[i] = last;
				chain.push(last, i);

			} else if (chainNav[last]!==undefined && chainNav[last]!==last) {
				const sharedNavigationRoute = findRequestNavigation(requestChain[chainNav[last]].requestLayer, requestLayer);

				if (sharedNavigationRoute) {
					chainNav[i] = chainNav[last];
					chain.push(i);
				}
			}

			if (chain.indexOf(i)===-1) {
				if (layerMode>0) {
					chainNav[i] = undefined;

					if (inLayerAutoMode) {
						chain.push(i);

					} else {
						chain.push(last, i);
					}

				} else {
					chain = [i];
				}
			}
		}

		inLayerAutoMode = layerMode>0 && last;
	}

	return chain.map(i => ({
		request: requestChain[i],
		navigation: chainNav[i]!==undefined && requestChain[chainNav[i]],
	}));
}


function createLayersTitle(layersChain) {
	const $titles = [];

	for (let { request: { back, requestLayer } } of layersChain.slice(0, -1)) {
		let $title = null;
		if (requestLayer.$title) {
			$title = requestLayer.$title.cloneNode(true);
			$title.setAttribute('data-target', 'title@app.layers:'+String(back)+'$');
			$titles.push($title);
		}
	}

	$titles.reverse();
	return $titles;
}


function createLayersNavigation(layersChain) {
	const layer = layersChain[layersChain.length-1];

	if (layer && layer.navigation) {
		const navigationLayer = layer.navigation.requestLayer;
		const navigationRoute = findRequestNavigation(navigationLayer, layer.request.requestLayer);

		if (navigationRoute) {
			return navigationLayer.$navigationList[navigationRoute].cloneNode(true);
		}
	}

	return null;
}


function createRequestChain(request, layerId, requestTree) {
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
			return createRequestChain(historyRequest, layerId, requestTree).concat(requestChain);
		}
	}

	return [requestChain];
}


function findRequestNavigation({ $navigationList }, { route, endpointArgs }) {
	const navigationRoutes = Object.keys($navigationList);

	navigationRoutes.sort(function(a, b) {
		return b.length-a.length;
	});

	for (let navigationRoute of navigationRoutes) {
		if (isRouteValid(route, endpointArgs, navigationRoute)) {
			return navigationRoute;
		}
	}
}


function isRouteValid(requestRoute, requestArgs, navigationKey) {
	requestRoute = String(requestRoute||'');
	requestRoute = requestRoute.replace(/^\s*:+/, '');
	requestRoute = requestRoute.replace(/\s+$/, '');

	navigationKey = String(navigationKey||'');
	navigationKey = navigationKey.replace(/^\s+/, '');
	navigationKey = navigationKey.replace(/\s+$/, '');

	let [navigationRoute, ...navigationArgs] = String(navigationKey||'').split('?');

	navigationRoute = navigationRoute.replace(/^\s+/, '');
	navigationRoute = navigationRoute.replace(/\s+$/, '');

	const missingArgs = navigationArgs.join('&').split('&').filter(arg => arg && requestArgs.indexOf(arg)===-1);

	if (missingArgs.length) {
		return false;
	}

	const requestRouteParts = requestRoute.split(':');
	const requestRouteAction = ':'+requestRouteParts.pop();
	const navigationAction = navigationRoute.match(/:([a-z][^:]*)?$/)!==null ? "" : requestRouteAction;

	const routes = [];
	if (navigationRoute[0]===":") {
		routes.push(navigationRoute.substr(1) + navigationAction);

	} else {
		for (let i=0; i<requestRouteParts.length; i++) {
			routes.push([].concat(requestRouteParts.slice(0, i+1), navigationRoute).join(':') + navigationAction);
		}
	}

	if (routes.indexOf(requestRoute)!==-1) {
		return true;

	} else if (navigationRoute.indexOf('*')!==-1) {
		for (let i=0; i<requestRouteParts.length; i++) {
			const requestRouteAsterisk = [].concat(
				requestRouteParts.slice(0, i),
				'*',
				requestRouteParts.slice(i+1)
			).join(':') + requestRouteAction;

			if (routes.indexOf(requestRouteAsterisk)!==-1) {
				return true;
			}
		}
	}

	return false;
}
