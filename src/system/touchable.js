
import closure from '../closure'


function debouncer(fn, delay) {
	const handler = function(_fn, _delay) {
		fn = _fn || fn;
		delay = _delay===undefined ? delay : _delay;
		handler.cancel();
		handler.timeout = setTimeout(fn, delay);
	}

	handler.timeout = null;
	handler.cancel = function() {
		clearTimeout(handler.timeout);
	}

	return handler;
}

const enable = $el => $el.classList.toggle('hover', true);
const disable = $el => $el.classList.toggle('hover', false);


export default function create() {
	let _touchable = false;
	let x = false;
	let _touched = false;
	let _moved = false;
	let $clicked = [];
	const cx = fn => $clicked.forEach(fn);
	const clicking = debouncer(() => { cx(enable); }, 150);
	const unclicking = debouncer(() => { cx(disable); $clicked=[]; }, 300);


	if ('ontouchstart' in window) {
		change(true);
	}

	this.event(document.documentElement, "touchstart", onTouchStart);
	this.event(document.documentElement, "touchmove", onTouchMove);
	this.event(document.documentElement, "touchend", onTouchEnd);
	this.event(document.documentElement, "mousemove", onMouseMove);
	this.event(document.documentElement, "click", onClick);
	this.event(document.documentElement, "click", onClickCapture, true);

	function onMouseMove() {
		if (_touched===false) {
			change(false);
		}
	}

	function onTouchStart(e) {
		_touched = true;
		_moved = false;
		change(true);
		clicked(e.target);
		clicking();
	}

	function onTouchMove() {
		clicking.cancel();
		_moved = true;
	}

	function onTouchEnd() {
		clicking.cancel();
		_moved===false && cx(enable);
		unclicking();
	}

	function onClick() {
		_touched = false;
	}

	function onClickCapture(e) {
		if (_touchable) {
			clicked(e.target);
			cx(enable);
			unclicking();
		}
	}

	function clicked($target) {
		const _$clicked = [];

		do {
			if (['a', 'button', 'img'].indexOf(String($target.tagName).toLowerCase())!==-1) {
				_$clicked.push($target);
			}
		} while ($target = $target.parentNode);

		$clicked.
			filter($el => _$clicked.indexOf($el)===-1).
			forEach(disable);

		$clicked = _$clicked;
	}

	function change(touchable) {
		if (_touchable!==touchable) {
			_touchable = touchable;

			try {
				if (_touchable) {
					fixHover(/:hover/g, '.hover');

				} else {
					fixHover(/\.hover([^-\w]|$)/g, (str, $0) => ':hover' + $0);
				}

			} catch (e) {}
		}
	}

	function fixHover(regexp, replacement) {
		closure.cssom.getAllCssStyleSheets().forEach(function(styleSheet) {
			const rules = [].slice.call(closure.cssom.getCssRulesFromStyleSheet(styleSheet)||[]);

			rules.forEach(function(rule, i) {
				const selectorText = String(rule&&rule.selectorText);

				if (!selectorText || regexp.test(selectorText)) {
					const cssText = String(rule&&rule.cssText);

					if (selectorText || regexp.test(cssText)) {
						styleSheet.insertRule(cssText.replace(regexp, replacement), i);

						if (styleSheet.deleteRule) {
							styleSheet.deleteRule(i+1);

						} else {
							styleSheet.removeRule(i+1);
						}
					}
				}
			});
		});
	}

	return function destroy() {
		unclicking();
		change(false);
	}
}
