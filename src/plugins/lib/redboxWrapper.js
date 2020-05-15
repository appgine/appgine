
import * as errorhub from '../errorhub'


let $redbox = null;
export default function redboxWrapper(errormsg, stash, tryFn)
{
	if (process.env.NODE_ENV !== 'production') {
		if ($redbox && stash.$redbox) {
			const ReactDOM = require('react-dom');
			ReactDOM.unmountComponentAtNode(stash.$redbox);
			$redbox.removeChild(stash.$redbox);
			delete stash.$redbox;

			if ($redbox.children.length===0 && $redbox.parentNode) {
				$redbox.parentNode.removeChild($redbox);
			}
		}
	}

	try {
		return tryFn();

	} catch (e) {
		if (process.env.NODE_ENV !== 'production') {
			if (document.body && $redbox.children.length===0) {
				document.body.parentElement.appendChild($redbox);
			}

			const React = require('react');
			const ReactDOM = require('react-dom');
			const RedBox = require('redbox-react');
			stash.$redbox = document.createElement('div');

			try {
				ReactDOM.render(React.createElement(RedBox.default||RedBox, {error: e}), stash.$redbox);
				$redbox = $redbox || document.createElement('div')
				$redbox.appendChild(stash.$redbox);

			} catch (e) {
				delete stash.$redbox;
			}
		}

		errorhub.dispatch(errorhub.ERROR.INSTANCE, errormsg, e, stash);
	}
}
