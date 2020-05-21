

let $redbox = null;
export function createRedBox() {
	return {
		stack: {},
		render(e) {
			$redbox = $redbox || document.createElement('div');

			if (document.body && $redbox.children.length===0) {
				document.body.parentElement.appendChild($redbox);
			}

			const React = require('react');
			const ReactDOM = require('react-dom');
			const { RedBoxError } = require('redbox-react');
			this.stack[e.message] = this.stack[e.message] || document.createElement('div');

			try {
				ReactDOM.render(React.createElement(RedBoxError, {error: e}), this.stack[e.message]);
				$redbox.appendChild(this.stack[e.message]);

			} catch (e) {
				delete this.stack[e.message];
			}
		},
		destroy() {
			if ($redbox) {
				const ReactDOM = require('react-dom');

				for (let key of Object.keys(this.stack)) {
					ReactDOM.unmountComponentAtNode(this.stack[key]);
					$redbox.removeChild(this.stack[key]);
					delete this.stack[key];
				}

				if ($redbox.children.length===0) {
					if ($redbox.parentNode) {
						$redbox.parentNode.removeChild($redbox);
					}
				}
			}
		}
	};
}
