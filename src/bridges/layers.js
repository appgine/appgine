
import closure from '../closure'
import * as history from '../engine/history'
import { requestStack } from '../engine/run'


export default function bridgeLayers(options={}, render) {
	require('../plugins').loader(function({ bind, bindApi }) {
		bindApi('request', require('../api/request').default);
		bindApi('targets', require('../api/targets').default);
		bindApi('shortcut', require('../api/shortcut').default);

		bind('app.layers.navigation', require('./layers.plugin').default);
	});

	const { initRequest } = options;

	options.initRequest = function(request) {
		initRequest && initRequest(request);

		request._layers = {};

		Array.from(request.$fragment.querySelectorAll('[data-layer]')).forEach(function($layer) {
			const dataLayer = $layer.getAttribute('data-layer')||'';
			const [layerId, route] = dataLayer.split('#').concat("");
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

			request._layers[layerId] = { route, isAutoLayer, $title, $navigationList };

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
	return _createLayers(request, layerId, history.getCurrentTree());
}


function _createLayers(request, layerId, requestTree) {
	let $navigation = null;
	const $titles = [];

	let _first = true;
	let _route = request._layers[layerId].route;
	let _isAutoLayer = request._layers[layerId].isAutoLayer;

	for (let i=requestTree.length-2; i>=0; i--) {
		const historyRequest = requestStack.loadHistoryRequest(requestTree[i]);

		if (!historyRequest || !historyRequest._layers[layerId]) {
			break;
		}

		const requestLayer = historyRequest._layers[layerId];
		const requestNavigation = findRequestNavigation(requestLayer, _route);

		if (request.endpoint===historyRequest.endpoint) {
			return _createLayers(request, layerId, requestTree.slice(0, i+1));
		}

		if (!requestNavigation) {
			if (requestLayer.isAutoLayer) {
				_first = false;
				_route = requestLayer.route;
				_isAutoLayer = requestLayer.isAutoLayer;
				continue;

			} else if (!_isAutoLayer) {
				break;
			}
		}

		if (requestLayer.$title) {
			const $title = requestLayer.$title.cloneNode(true);
			$title.dataset.target = 'title@app.layers.navigation:'+String(i)+'$';
			$titles.push($title);
		}

		if (_first && requestNavigation) {
			$navigation = requestNavigation.cloneNode(true);
		}

		_first = false;
		_route = requestLayer.route;
		_isAutoLayer = requestLayer.isAutoLayer;
	}

	return { $titles, $navigation }
}


function findRequestNavigation(requestLayer, route) {
	route = String(route||'');
	route = route.replace(/^\s*:+/, '');
	route = route.replace(/\s+$/, '');

	for (let navigationRoute of Object.keys(requestLayer.$navigationList)) {
		let _navigationRoute = String(navigationRoute||'');
		_navigationRoute = _navigationRoute.replace(/^\s+/, '');
		_navigationRoute = _navigationRoute.replace(/\s+$/, '');

		const routes = [];
		if (_navigationRoute[0]===":") {
			routes.push(_navigationRoute.substr(1));

		} else {
			let _route = String(requestLayer.route||'');
			_route = _route.replace(/^\s*:+/, '');
			_route = _route.replace(/\s+$/, '');

			const _routeParts = _route.split(':');
			const _routeBuild = [];

			for (let i=0; i<_routeParts.length; i++) {
				_routeBuild.push(_routeParts[i]);
				routes.push(_routeBuild.concat(_navigationRoute).join(':'));
			}
		}

		if (routes.indexOf(route)!==-1) {
			return requestLayer.$navigationList[navigationRoute];
		}
	}
}
