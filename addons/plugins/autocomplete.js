
import { uri, selection, string } from 'appgine/closure'

import { bindReact } from 'appgine/hooks/react'
import { useEvent } from 'appgine/hooks/event'
import { bindDispatch } from 'appgine/hooks/channel'
import { useTimeout, bindTimeout } from 'appgine/hooks/timer'
import { usePluginShortcut } from 'appgine/hooks/shortcut'
import { bindPluginAjax } from 'appgine/hooks/ajax'
import { useTargets } from 'appgine/hooks/target'


export default function create($input, Component, activeSelector, endpoint, inputName=null) {
	const [ajaxTimeout, destroyAjaxTimeout] = bindTimeout();
	const [ajax, ajaxAbort] = bindPluginAjax();
	const dispatch = bindDispatch('autocomplete');

	const state = {token: null, results: [], visible: false, loading: null};

	const request = token => {
		ajaxAbort();
		state.loading = token;

		if (token) {
			ajaxTimeout(() => {
				ajax(uri.create(endpoint, {[inputName||$input.name]: token}), (status, response) => {
					if (response.code>0) {
						if (response.code===200 || token===state.loading) {
							handleResults(token, response.code===200 && Array.isArray(response.json) && response.json || []);
						}
					}
				});
			}, 100);

		} else if (token!==null) {
			destroyAjaxTimeout();
			handleResults(token, []);
		}
	}

	function handleResults(token, results) {
		if (state.loading===token) {
			destroyAjaxTimeout();
			state.token = token;
			state.loading = null;
		}

		let hilitate = !($input.form && $input.form.hasAttribute('action'));

		state.visible = results.length>0;
		state.results = results.map((result, i) => {
			return Object.assign({}, result, {
				active: i===0 && (hilitate || canonizeText(result.title)===canonizeText(token)),
				onClick() { dispatch('redirect', result.url||result.redirect) },
				onMouseMove() { renderIndex(i) },
			});
		});;

		render();
		token && dispatch('type', token);
	}

	function canonizeText(text) {
		if (text.normalize) {
			text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
		}

		return string.collapseWhitespace(text).toLowerCase();
	}

	useEvent($input, 'focus', () => {
		if (state.loading===null) {
			state.visible = state.results.length>0;
			state.results.forEach(result => (result.active = false));
			render();
		}
	});

	useEvent($input, 'keyup', () => {
		const token = string.collapseWhitespace($input.value);

		if (state.token===token) {
			request(null);

		} else if (token==='') {
			request('');

		} else if (state.loading!==token) {
			request(token);
		}
	});

	useEvent(document, 'click', function(e) {
		if ($input===e.target) {
			return true;

		} else if ($input.contains(e.target)) {
			return true;
		}

		for (let { $target } of targets) {
			if ($target===e.target) {
				$input.focus();
				e.preventDefault();
				return true;

			} else if ($target.contains(e.target)) {
				$input.focus();
				return true;
			}
		}

		unmount();
	});

	usePluginShortcut('up', function(e) {
		renderIndexStep(-1);
		state.visible && e.preventDefault();
	});

	usePluginShortcut('down', function(e) {
		if ($input.value.length!==selection.getStart($input)) {
			return true;

		} else if ($input.value.length!==selection.getEnd($input)) {
			return true;
		}

		state.visible = state.results.length>0;
		renderIndexStep(1);
	});

	usePluginShortcut('esc', function(e) {
		unmount();
		e.preventDefault();
	});

	usePluginShortcut('enter', function(e) {
		useTimeout(unmount, 100);
		targets.forEach(({ $target }) => {
			const $a = $target.querySelector(activeSelector);
			if ($a) {
				e.preventDefault();
				$a.click();
			}
		});
	});

	const targets = useTargets('content', function($target, target) {
		const [useReact, destroyReact] = bindReact($target);
		state.visible && useReact(Component, { $input, endpoint, unmount, results: state.results });
		return { $target, useReact, destroyReact };
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

		} else {
			targets.forEach(({ useReact }) => useReact(Component, { $input, endpoint, unmount, results: state.results }));
		}
	}

	function unmount() {
		state.visible = false;
		state.results.forEach(result => (result.active = false));
		targets.forEach(({ destroyReact }) => destroyReact());
	}
}
