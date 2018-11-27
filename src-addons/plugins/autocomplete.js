
import React from 'react'
import ReactDOM from 'react-dom'
import { uri, selection, string } from 'appgine/lib/closure'


export default function create($input, Component, activeSelector, endpoint, state) {
	let tokenTimeout;

	state.initial({token: null, results: [], visible: false, loading: null});

	const dispatch = this.dispatch.bind(this, 'autocomplete');
	const targets = this.createTargets();

	const request = token => {
		this.ajaxAbort();
		clearTimeout(tokenTimeout);
		state.loading = token;

		if (token) {
			tokenTimeout = setTimeout(() => {
				this.ajax(uri.create(endpoint, {[$input.name]: token}), (status, response) => {
					if (response.code>0) {
						if (response.code===200 || token===state.loading) {
							handleResults(token, response.code===200 ? response.json : []);
						}
					}
				});
			}, 100);

		} else if (token!==null) {
			handleResults(token, []);
		}
	}

	function handleResults(token, results) {
		if (state.loading===token) {
			clearTimeout(tokenTimeout);
			state.token = token;
			state.loading = null;
		}

		let hilitate = !($input.form && $input.form.hasAttribute('action'));

		state.visible = results.length>0;
		state.results = results.map((result, i) => {
			return Object.assign({}, result, {
				active: i===0 && (hilitate || canonizeText(result.title)===canonizeText(token)),
				onClick: () => dispatch('redirect', result.url||result.redirect),
				onMouseMove: () => renderIndex(i, false),
			});
		});;

		render();
		token && dispatch('type', token);
	}

	function canonizeText(text) {
		return string.toAscii(string.collapseWhitespace(text)).toLowerCase();
	}

	this.event($input, 'focus', () => {
		if (state.loading===null) {
			state.visible = state.results.length>0;
			state.results.forEach(result => (result.active = false));
			render();
		}
	});

	this.event($input, 'keyup', () => {
		const token = string.collapseWhitespace($input.value);

		if (state.token===token) {
			request(null);

		} else if (token==='') {
			request('');

		} else if (state.loading!==token) {
			request(token);
		}
	});

	this.event(document, 'click', function(e) {
		if ($input===e.target) {
			return true;

		} else if ($input.contains(e.target)) {
			return true;
		}

		for (let target of targets.findAll('content')) {
			if (target.$element===e.target) {
				e.preventDefault();
				return true;

			} else if (target.$element.contains(e.target)) {
				e.preventDefault();
				return true;
			}
		}

		unmount();
	});

	this.onPluginShortcut('up', function(e) {
		renderIndexStep(-1);
		state.visible && e.preventDefault();
	});

	this.onPluginShortcut('down', function(e) {
		if ($input.value.length!==selection.getStart($input)) {
			return true;

		} else if ($input.value.length!==selection.getEnd($input)) {
			return true;
		}

		state.visible = state.results.length>0;
		renderIndexStep(1);
	});

	this.onPluginShortcut('esc', function(e) {
		unmount();
		e.preventDefault();
	});

	this.onPluginShortcut('enter', function(e) {
		setTimeout(unmount, 100);

		for (let target of targets.findAll('content')) {
			const $a = target.$element.querySelector(activeSelector);

			$a && $a.click();
			$a && e.preventDefault();
		}
	});

	targets.every('content', function($container, target) {
		state.visible && ReactDOM.render(<Component results={state.results} />, $container);

		return function() {
			ReactDOM.unmountComponentAtNode($container);
		}
	});

	function renderIndexStep(step) {
		const index = state.results.findIndex(result => result.active);

		if (state.results.length>1) {
			renderIndex((index+state.results.length+step) % state.results.length);

		} else {
			renderIndex(index+1);
		}
	}

	function renderIndex(index) {
		const active = state.results.findIndex(result => result.active);

		state.results.forEach((result, i) => (result.active = i===index));

		if (active!==state.results.findIndex(result => result.active)) {
			render();
		}
	}

	function render() {
		if (state.visible===false) {
			unmount();
		}

		if (state.visible) {
			for (let target of targets.findAll('content')) {
				ReactDOM.render(<Component results={state.results} />, target.$element);
			}
		}
	}

	function unmount() {
		state.visible = false;
		state.results.forEach(result => (result.active = false));

		for (let target of targets.findAll('content')) {
			ReactDOM.unmountComponentAtNode(target.$element);
		}
	}
}
