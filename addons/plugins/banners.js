
import React from 'appgine/react'

import { useListen } from 'appgine/hooks/channel'
import { useTargets, useComplete } from 'appgine/hooks/target'
import { bindTimeout, useTimeout } from 'appgine/hooks/timer'


export default function create($element, { autoInterval }) {
	const [ rotateTimeout, rotateDestroy ] = bindTimeout();

	const state = { active: 0 };

	useListen('modal', 'open', function() {
		$element.classList.add('paused');
		rotateDestroy();
	});

	useListen('modal', 'close', function() {
		$element.classList.remove('paused');
		startAutoRotate();
	});

	const $banners = useTargets('banner', $banner => $banner);
	const $buttons = useTargets('buttons', $target => {
		const $children = Array.from(Array($banners.length).keys()).map(index => (
			<button type="button" role="presentation" tabIndex={-1} onClick={() => changeIndex(index)} class={{ active: state.active===index }}>
				{index+1}
			</button>
		));

		React.render($target, $children);
		return $children;
	});

	useComplete(function() {
		startAutoRotate();
		return rotateDestroy;
	});


	function startAutoRotate() {
		rotateDestroy();
		if (autoInterval!==false) {
			rotateTimeout(() => changeIndex((state.active+1)%$banners.length), autoInterval||5000);
		}
	}

	function changeIndex(index) {
		startAutoRotate();

		if (state.active!==index) {
			$buttons.forEach($buttons => $buttons[state.active] && $buttons[state.active].classList.remove('active'));
			$buttons.forEach($buttons => $buttons[index] && $buttons[index].classList.add('active'));
			state.active = index;

			if ($banners[index]) {
				$banners[index].classList.add('visible');

				const $activeList = $banners.filter($banner => $banner.classList.contains('active'));
				$banners.forEach($banner => $banner.classList.remove('fadeout'));
				$activeList.forEach($banner => $banner.classList.add('fadeout'));
				$activeList.forEach($banner => $banner.classList.remove('active', 'fadein'));

				const $banner = $banners[index];
				useTimeout(function() {
					$banner.classList.toggle('active', state.active===index);
					$banner.classList.toggle('fadein', state.active===index);
				}, 200);
			}
		}
	}

}
