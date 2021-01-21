
import { uri, selection } from 'appgine/closure'

import { useEvent } from 'appgine/hooks/event'
import { useFormRequest } from 'appgine/hooks/progress'
import { bindDispatch } from 'appgine/hooks/channel'
import { useTimeout, bindTimeout } from 'appgine/hooks/timer'
import { usePluginShortcut } from 'appgine/hooks/shortcut'
import { bindPluginAjax } from 'appgine/hooks/ajax'
import { useTargets } from 'appgine/hooks/target'

import { canonizeText, normalizeText } from 'appgine/utils/text'
import clone from 'appgine/utils/clone'


export default function create($input, endpoint, createAutocomplete, inputName=null) {
	const [ajaxTimeout, destroyAjaxTimeout] = bindTimeout();
	const [ajax, ajaxAbort] = bindPluginAjax();
	const dispatch = bindDispatch('autocomplete');

	const state = {token: null, results: [], visible: false, loading: null, container: []};

	function handleResults(token, results) {
		if (state.loading===token) {
			state.loading = null;
			state.token = token;
			destroyAjaxTimeout();
		}

		const hilitate = !($input.form && $input.form.hasAttribute('action'));
		const active = results[0] && (hilitate || canonizeText(results[0].title||results[0].label||'')===canonizeText(token)) ? 0 : null;

		state.visible = results.length>0;
		state.active = active;
		state.results = results.map((result, i) => {
			return Object.assign({}, result, {
				onClick() { dispatch('redirect', result.url||result.redirect) },
				onMouseMove() { renderIndex(i) },
			});
		});;

		render();
		token && dispatch('type', token);
	}

	useFormRequest($input, unmount);

	useEvent($input, 'focus', () => {
		if (state.visible===false && state.results.length>0 && state.loading===null) {
			state.visible = true;
			state.active = null;
			render();
		}
	});

	useEvent($input, 'blur', () => {
		useTimeout(function() {
			const $active = document.activeElement;

			for (let { $target } of targets.concat(state.container)) {
				if ($target.contains($active)) {
					return;
				}
			}

			unmount();
		}, 0);
	}, true);

	useEvent($input, 'keyup', () => {
		const token = normalizeText($input.value);

		if (state.loading!==token) {
			state.loading = token;
			ajaxAbort();

			if (token==='') {
				handleResults(token, []);

			} else if (state.token===token) {
				state.loading = null;
				destroyAjaxTimeout();

			} else {
				ajaxTimeout(() => {
					ajax(uri.create(endpoint, {[inputName||$input.name]: token}), (status, response) => {
						if (response.code>0) {
							if (response.code===200 || token===state.loading) {
								handleResults(token, response.code===200 && Array.isArray(response.json) && response.json || []);
							}
						}
					});
				}, 100);
			}
		}
	});

	useEvent(document, 'click', function(e) {
		if (state.visible===false) {
			return;

		} else if ($input===e.target) {
			return;

		} else if ($input.contains(e.target)) {
			return;
		}

		for (let { $target } of targets.concat(state.container)) {
			if ($target===e.target) {
				$input.focus();
				e.preventDefault();
				return;

			} else if ($target.contains(e.target)) {
				$input.focus();
				return;
			}
		}

		unmount();
	});

	usePluginShortcut('up', function(e) {
		renderIndexStep(-1);
		state.visible && e.preventDefault();
	});

	usePluginShortcut('down', function(e) {
		if ($input.value.length===selection.getStart($input)) {
			if (state.visible) {
				renderIndexStep(1);
				e.preventDefault();

			} else if (state.results.length && state.loading===null) {
				state.visible = true;
				render();
			}
		}
	});

	usePluginShortcut('esc', function(e) {
		e.preventDefault();
		state.visible && unmount();
	});

	usePluginShortcut('enter', function(e) {
		useTimeout(unmount, 100);
		targets.concat(state.container).some(({ component }) => component.enter && component.enter(e));
	});

	const targets = useTargets('content', function($target, target) {
		unmountContainer();
		const component = createAutocomplete($target);
		state.visible && component.results && component.results(clone(state.results), state.active);
		return { $target, component };
	});

	function renderIndexStep(step) {
		if (state.results.length) {
			if (state.active===null) {
				renderIndex(step>0 ? 0 : state.results.length-1);

			} else {
				renderIndex((state.active+state.results.length+step) % state.results.length);
			}
		}
	}

	function renderIndex(index) {
		if (state.active!==index) {
			state.active = index;
			targets.concat(state.container).forEach(({ component }) => component.changeActive && component.changeActive(state.active));
		}
	}

	function render() {
		if (state.visible===false) {
			return unmount();
		}

		if (targets.length===0 && state.container.length===0) {
			const $target = document.createElement('div');
			$input.parentNode.appendChild($target);
			state.container.push({ $target, component: createAutocomplete($target) });

		} else if (targets.length) {
			unmountContainer();
		}

		targets.concat(state.container).forEach(({ component }) => component.results && component.results(clone(state.results), state.active, { $input, endpoint, unmount }));
	}

	function unmount() {
		state.visible = false;
		state.active = null;
		targets.forEach(({ component }) => component.destroy && component.destroy());
		unmountContainer();
	}

	function unmountContainer() {
		for (let { $target, component } of state.container.splice(0, state.container.length)) {
			component.destroy && component.destroy();
			$target.parentNode && $target.parentNode.removeChild($target);
		}
	}
}
