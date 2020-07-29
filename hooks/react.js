
import { useContext, bindContext } from 'appgine/hooks'

import React from 'react'
import ReactDOM from 'react-dom'


export function useReact($node, Component, props) {
	return useContext(function() {
		const react = props ? <Component {...props} /> : Component;
		ReactDOM.render(react, $node);
		return () => ReactDOM.unmountComponentAtNode($node);
	});
}


export function bindReact($node) {
	return bindContext(useReact.bind(null, $node));
}


export function bindReactContainer($node) {
	let $container = null;
	return bindContext(function(Component, props) {
		if ($container===null) {
			$container = document.createElement('div');
			$node.appendChild($container);
		}

		const react = props ? <Component {...props} /> : Component;
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
