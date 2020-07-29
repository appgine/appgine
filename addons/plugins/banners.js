
import React from 'react'

import { useListen } from 'appgine/hooks/channel'
import { useTargets, useComplete } from 'appgine/hooks/target'
import { bindReact } from 'appgine/hooks/react'
import { bindTimeout } from 'appgine/hooks/timer'


export default function create(ButtonsComponent, $element, { autoInterval }) {
	const [ rotateTimeout, rotateDestroy ] = bindTimeout();

	const state = { active: 0 };
	let autorotate = null;

	useListen('modal', 'open', function() {
		$element.classList.add('paused');
		rotateDestroy();
	});

	useListen('modal', 'close', function() {
		$element.classList.remove('paused');
		startAutoRotate();
	});

	const $banners = useTargets('banner', $banner => $banner);
	const buttons = useTargets('buttons', $buttons => bindReact($buttons));

	useComplete(function() {
		render();
		startAutoRotate();
		return rotateDestroy;
	});


	function startAutoRotate() {
		rotateDestroy();
		if (autoInterval!==false) {
			autorotate = rotateTimeout(function() {
				changeIndex((state.active+1)%$banners.length);
			}, autoInterval||5000);
		}
	}

	function changeIndex(index) {
		startAutoRotate();
		if (state.active!==index) {
			state.active = index;

			if ($banners[index]) {
				$banners[index].classList.add('visible');

				$banners.forEach($banner => $banner.classList.remove('fadeout'));

				$banners.
					filter($banner => $banner.classList.contains('active')).
					forEach($banner => {
						$banner.classList.add('fadeout');
						$banner.classList.remove('active');
						$banner.classList.remove('fadein');
					});


				const $banner = $banners[index];
				setTimeout(function() {
					if (state.active===index) {
						$banner.classList.add('active');
						$banner.classList.add('fadein');
					}
				}, 200);
			}

			render();
		}
	}

	function render() {
		buttons.forEach(useReact => useReact(<ButtonsComponent count={$banners.length} active={state.active} onClick={changeIndex}/>));
	}
}
