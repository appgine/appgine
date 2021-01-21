
import createLoader from 'appgine/plugins'
import { useEvent } from 'appgine/hooks/event'

import * as swapApi from './plugins/swap'
import * as targetApi from 'appgine/hooks/target'

createLoader(module, function({ bindPlugin }) {
	bindPlugin('ReactEvent', function($node, event) {
		$node[event + 'ReactEvent'] && useEvent($node, event, $node[event + 'ReactEvent']);
	});
});


export default {
	transaction(fn) {
		targetApi.transaction(fn);
	},
	appendChild($container, ...$nodeList) {
		targetApi.transaction(function() {
			$nodeList.forEach($node => {
				const $div = document.createElement('div');
				$container.appendChild($div);
				const $nextNode = swapApi.swapElement($div, $node);
				$nextNode && targetApi.addElement($nextNode);
			});
		});
	},
	unmount(...$nodeList) {
		targetApi.transaction(function() {
			$nodeList.forEach($node => $node && targetApi.removeElement($node));
			$nodeList.forEach($node => $node && swapApi.removeElement($node));
		});
	},
	clean($container) {
		this.unmount(...Array.from($container.children));
	},
	swapElement($element, content) {
		targetApi.transaction(function() {
			targetApi.removeElement($element);
			const $nextNode = swapApi.swapElement($element, content);
			$nextNode && targetApi.addElement($nextNode);
		});
	},
	render($container, $element) {
		targetApi.transaction(() => {
			this.unmount(...Array.from($container.children));
			this.appendChild($container, ...(Array.isArray($element) ? $element : [$element]));
		});
	},
	createRef() {
		return {current: null};
	},
	createElement(tagName, attrs, ...children) {
		const $element = document.createElement(tagName);

		let targets = [];
		let plugins = [];
		for (let attrKey of Object.keys(attrs||{})) {
			let attrValue = attrs[attrKey];
			attrKey = attrKey==='className' ? 'class' : attrKey;

			if (attrKey==='ref') {
				attrValue && (attrValue.current = $element);

			} else if (attrKey==='target' || attrKey==='plugin') {
				if (typeof attrValue === 'object') {
					for (let targetKey of Object.keys(attrValue||{})) {
						(attrKey==='target' ? targets : plugins).push(targetKey + ':' + JSON.stringify(attrValue[targetKey]));
					}

				} else {
					(attrKey==='target' ? targets : plugins).push(attrValue);
				}

			} else if (typeof attrValue === 'function') {
				attrKey = attrKey.substr(2).toLowerCase();
				plugins.push('ReactEvent:' + attrKey);
				$element[attrKey + 'ReactEvent'] = attrValue;

			} else if (attrKey==='style') {
				if (typeof attrValue === 'string') {
					$element.style.cssText = attrValue;

				} else {
					for (let styleKey of Object.keys(attrValue)) {
						const match = attrValue[styleKey].match(/(.*?)\s*(!important)?\s*$/);
						$element.style.setProperty(styleKey, match[1], match[2] && 'important');
					}
				}

			} else if (attrKey==='class' && typeof attrValue==='object') {
				for (let classKey of Object.keys(attrValue)) {
					$element.classList.toggle(classKey, !!attrValue[classKey]);
				}

			} else {
				$element.setAttribute(attrKey, attrValue);
			}
		}

		appendChildren($element, children);

		targets.length>0 && $element.setAttribute('data-target', targets.join('$'));
		plugins.length>0 && $element.setAttribute('data-plugin', plugins.join('$'));

		return $element;
	},
}

function appendChildren($element, children) {
	for (let child of children) {
		if (child===null) {
			continue;

		} else if ('string' === typeof child || 'number' === typeof child || 'boolean' === typeof child || child instanceof Date || child instanceof RegExp) {
			$element.appendChild(document.createTextNode(child.toString()));

		} else if (Array.isArray(child)) {
			appendChildren($element, child);

		} else if (child) {
			$element.appendChild(child);
		}
	}
}
