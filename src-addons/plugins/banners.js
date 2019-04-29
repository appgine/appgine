
import React from 'react'
import ReactDOM from 'react-dom'


export default function create(ButtonsComponent, $element, { autoInterval }, state) {
	state.initial({active: 0});
	let autorotate = null;

	const targets = this.createTargets(function(targets) {
		targets.every('buttons', function($element) {
			return () => ReactDOM.unmountComponentAtNode($element);
		});

		targets.complete(function() {
			render();
			startAutoRotate();
			return clearAutoRotate;
		});
	});

	function clearAutoRotate() {
		clearTimeout(autorotate);
	}

	function startAutoRotate() {
		clearAutoRotate();
		autorotate = setTimeout(function() {
			changeIndex((state.active+1)%targets.findAll('banner').length);
		}, autoInterval||5000);
	}

	function changeIndex(index) {
		startAutoRotate();
		state.active = index;

		const $banners = targets.findAllElement('banner');

		if ($banners[index]) {
			$banners.forEach($banner => $banner.classList.remove('active'));
			$banners[index].classList.add('visible');

			setTimeout(function() {
				if (state.active===index) {
					$banners[index].classList.add('active');
				}
			}, 200);
		}

		render();
	}

	function render() {
		const count = targets.findAllElement('banner').length;

		targets.findAll('buttons', function({ $element }) {
			ReactDOM.render(<ButtonsComponent count={count} active={state.active} onClick={changeIndex}/>, $element);
		});
	}
}
