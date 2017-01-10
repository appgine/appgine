
import closure from '../closure'
import * as history from '../engine/history'
import { requestStack } from '../engine/run'


export default function bridgeLayers(options={}, render) {
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

			Array.from($layer.querySelectorAll(':not([data-layer]) [layer-navigation]')).forEach(function($navigation) {
				const route = $navigation.getAttribute('layer-navigation')||'';
				$navigation.parentNode.removeChild($navigation);
				$navigation.removeAttribute('layer-navigation');

				$navigationList[route] = $navigation;
			});

			request._layers[layerId] = { route, isAutoLayer, $title, $navigationList };

			const $content = $layer.querySelector(':not([data-layer]) [layer-content]');

			if ($content) {
				$content.parentNode.removeChild($content);
				$content.removeAttribute('layer-content');
			}

			const { $titles, $navigation } = createLayers(layerId, route, isAutoLayer);

			$layer.parentNode.replaceChild(render($layer, $titles, $navigation, $content) || $layer, $layer);
		});
	}

	return options;
}


function createLayers(layerId, route, isAutoLayer) {
	let $navigation = null;
	const $titles = [];

	let _first = true;
	let _route = route;
	let _isAutoLayer = isAutoLayer;

	const requestTree = history.getCurrentTree();
	requestTree.reverse();
	requestTree.shift();

	for (let requestId of requestTree) {
		const request = requestStack.loadHistoryRequest(requestId);

		if (!request || !request._layers[layerId]) {
			break;
		}

		const requestLayer = request._layers[layerId];
		const requestNavigation = findRequestNavigation(requestLayer, _route);

		if (!_isAutoLayer && !requestNavigation) {
			break;
		}

		requestLayer.$title && $titles.push(requestLayer.$title.cloneNode(true));

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
