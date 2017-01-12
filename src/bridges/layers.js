
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
			const [layerId, route] = ($layer.getAttribute('data-layer')||'').split('#').concat("");
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

			let { $titles, $navigation } = createLayers(layerId, route, isAutoLayer);
			let result = render($layer, $titles, $navigation, $content);

			if (result instanceof Element) {
				result = { $container: result };

			} else {
				result = result || {};
			}

			if (result.$navigation) {
				$navigation = result.$navigation;
			}

			const navigationActive = String(result.navigationActive||'');
			const toggleActive = String(result.toggleActive||'');
			const pluginData = JSON.stringify([navigationActive, toggleActive]);

			if ($navigation) {
				$navigation.dataset.plugin = 'app.layers.navigation:'+pluginData+'$' + String($navigation.dataset.plugin||'');

				if (result.$toggle) {
					result.$toggle.dataset.target = 'toggle@app.layers.navigation';
				}
			}

			$layer.parentNode.replaceChild(result.$container || $layer, $layer);
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


function createLayers(layerId, route, isAutoLayer) {
	let $navigation = null;
	const $titles = [];

	let _first = true;
	let _route = route;
	let _isAutoLayer = isAutoLayer;

	const requestTree = history.getCurrentTree();

	for (let i=requestTree.length-2; i>=0; i--) {
		const request = requestStack.loadHistoryRequest(requestTree[i]);

		if (!request || !request._layers[layerId]) {
			break;
		}

		const requestLayer = request._layers[layerId];
		const requestNavigation = findRequestNavigation(requestLayer, _route);

		if (!_isAutoLayer && !requestNavigation) {
			break;
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
