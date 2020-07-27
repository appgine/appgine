
import { useContext, bindContext } from 'appgine/hooks'

import React from 'react'
import ReactDOM from 'react-dom'


export function useReact($node, react) {
	return useContext(function() {
		ReactDOM.render(react, $node);
		return () => ReactDOM.unmountComponentAtNode($node);
	});
}


export function bindReact($node) {
	return bindContext(useReact.bind(null, $node));
}


export function bindReactContainer($node) {
	let $container = null;
	return bindContext(function(react) {
		if ($container===null) {
			$container = document.createElement('div');
			$node.appendChild($container);
		}

		ReactDOM.render(react, $container);

		return function() {
			if ($container) {
				ReactDOM.unmountComponentAtNode($container);
				$container.parentNode.removeChild($container);
				$container = null;
			}
		}
	});
}
