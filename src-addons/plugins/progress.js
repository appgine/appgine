
export const shouldShowRequestProgress = 'shouldShowRequestProgress'


export default function create($root) {
	const plugin = this;
	const $container = $root.children[0] && $root.children[0].tagName=='DIV' && $root.children[0] || document.createElement('div');

	let _visible = false;
	let _requestnum = 0;
	let _animation = $container.animate ? createJSAnimation($container) : createCSSAnimation($root, $container);

	$root.classList.add('progress');
	$root.appendChild($container);

	this.listen('app.request', 'start', function(endpoint, { $element, requestnum }) {
		_requestnum = Math.max(_requestnum, requestnum);

		let showProgress = true;
		if ($element) {
			for (let method of plugin.findElementMethods(shouldShowRequestProgress, $element)) {
				showProgress = showProgress && method($element);
			}
		}

		if (_visible===false && showProgress) {
			_visible = true;
			_animation.start();
		}
	});

	this.listen('app.request', 'response', function({ requestnum }) {
		if (_visible && requestnum===_requestnum) {
			_animation.response();
		}
	});

	this.listen('app.request', 'stop', function({ requestnum }) {
		setTimeout(function() {
			if (_visible && requestnum===_requestnum) {
				_visible = false;
				_animation.end();
			}

		}, 100);
	});

	this.listen('app.request', 'leave', function() {});

	this.listen('app.request', 'abort', function() {
		if (_visible) {
			_visible = false;
			_animation.abort();
		}
	});
}


function createCSSAnimation($root, $container)
{
	let _pendingHidden;

	return {
		start() {
			clearTimeout(_pendingHidden);

			$root.classList.remove('progress-loading');
			$root.classList.remove('progress-loaded');
			$root.classList.remove('progress-hidden');

			setTimeout(() => {
				$root.classList.add('progress-loading');
				$container.style.width = '';
				$container.style.animationDuration = '';
			}, 0);
		},
		response() {
			$container.style.width = $container.getBoundingClientRect().width + 'px';
			$root.classList.remove('progress-loading');
		},
		end() {
			$root.classList.remove('progress-loading');
			$container.style.width = '';
			$container.style.animationDuration = '';
			$root.classList.add('progress-loaded');

			_pendingHidden = setTimeout(() => $root.classList.add('progress-hidden'), 1000);
		},
		abort() {
			$root.classList.remove('progress-loading');
			$container.style.width = '';
			$container.style.animationDuration = '';
		},
		destroy() {
			$container.style.width = '';
			$container.style.animationDuration = '';
			$root.classList.remove('progress-loading', 'progress-loaded', 'progress-hidden');
		},
	}
}


function createJSAnimation($container)
{
	let jsAnimation = null;

	return {
		start() {
			$container.style.width = '0%';
			$container.style.visibility = '';

			setTimeout(() => {
				jsAnimation && jsAnimation.cancel();
				jsAnimation = $container.animate([
					{width: '5%', offset: 0.0},
					{width: '8%', offset: 0.008},
					{width: '10%', offset: 0.015},
					{width: '15%', offset: 0.025},
					{width: '30%', offset: 0.05},
					{width: '50%', offset: 0.065},
					{width: '60%', offset: 0.08},
					{width: '65%', offset: 0.09},
					{width: '70%', offset: 0.125},
					{width: '75%', offset: 0.15},
					{width: '76%', offset: 0.20},
					{width: '76.5%', offset: 0.25},
					{width: '77%', offset: 0.35},
					{width: '77.5%', offset: 0.50},
					{width: '78%', offset: 0.70},
					{width: '79%', offset: 0.80},
					{width: '79.5%', offset: 0.90},
					{width: '80%', offset: 1.00}
				], {
					duration: 50000,
				});

				const animation = jsAnimation;
				jsAnimation.onfinish = function() {
					if (jsAnimation===animation) {
						jsAnimation = undefined;
						$container.style.width = '80%';
					}
				}
			}, 0);
		},
		response() {

		},
		end() {
			if (!jsAnimation || jsAnimation.playState==='running') {
				this._end();

			} else if (jsAnimation.playbackRate===undefined) {
				jsAnimation.cancel();
				this._end();

			} else {
				jsAnimation.onfinish = this._end;
				jsAnimation.playbackRate = 500;
			}
		},
		abort() {
			$container.style.visibility = 'hidden';
		},
		destroy() {
			jsAnimation && jsAnimation.cancel();
		},
		_end() {
			jsAnimation && jsAnimation.pause();

			const width = $container.getBoundingClientRect().width;
			const parentWidth = $container.parentNode.getBoundingClientRect().width;
			const start = width/parentWidth*100;

			jsAnimation && jsAnimation.cancel();
			jsAnimation = $container.animate([
				{width: String(start)+'%', offset: 0.0},
				{width: '100%', offset: start<50 ? 0.5 : 0.25},
				{width: '100%', offset: 1.00},
			], {
				duration: 500,
			});

			const animation = jsAnimation;
			jsAnimation.onfinish = function() {
				if (jsAnimation===animation) {
					jsAnimation = undefined;
					$container.style.visibility = 'hidden';
				}
			}
		}
	}
}
