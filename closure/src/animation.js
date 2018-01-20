
goog.module('animation');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.fx.Animation.EventType');
goog.require('goog.fx.dom.Scroll');


exports.scrollLeft = function(scrollLeft, onEnd) {
	return exports.scrollTo(scrollLeft, goog.dom.getDocumentScroll().y, onEnd);
}

exports.scrollTop = function(scrollTop, onEnd) {
	return exports.scrollTo(goog.dom.getDocumentScroll().x, scrollTop, onEnd);
}

exports.scrollTo = function(scrollLeft, scrollTop, onEnd) {
	var scrollFrom = goog.dom.getDocumentScroll();

	return exports.scrollElementTo(
		goog.dom.getDocumentScrollElement(),
		scrollFrom.x, scrollFrom.y,
		scrollLeft, scrollTop,
		onEnd
	);
}

exports.scrollElementTo = function($element, scrollLeftFrom, scrollTopFrom, scrollLeft, scrollTop, onEnd, time) {
	if (scrollLeftFrom!==scrollLeft || scrollTopFrom!==scrollTop) {
		var diffLeft = Math.abs(scrollLeftFrom - scrollLeft);
		var diffTop = Math.abs(scrollTopFrom - scrollTop);

		var animation = new goog.fx.dom.Scroll(
			$element,
			[scrollLeftFrom, scrollTopFrom],
			[scrollLeft, scrollTop],
			time || Math.min(300, Math.max(100, Math.ceil(diffLeft/3)), Math.max(100, Math.ceil(diffTop/3)))
		);

		goog.events.listen(animation, goog.fx.Animation.EventType.END, onEnd||function() {});
		animation.play();

	} else if (onEnd) {
		onEnd();
	}
}

exports.scrollToLazy = function(fn, onEnd) {
	var _animationEnded = false;
	var _animationRequest = null;
	var _animationPositions = [-1, -1];
	var _animationTime = -1;
	var _animation;

	var _animationEnd = function() {
		window.cancelAnimationFrame(_animationRequest);

		if (_animationEnded===false) {
			_animationEnded = true;
			onEnd && onEnd();
			onEnd = undefined;
		}
	}


	var _animationFrame = function() {
		_animationRequest = window.requestAnimationFrame(_animationFrame);

		var positions = fn();
		var scrolled = goog.dom.getDocumentScroll();

		if (scrolled.x===positions[0] && scrolled.y===positions[1]) {
			_animation && _animation.stop();
			_animationEnd && _animationEnd();

		} else if (_animationTime===-1 || _animationPositions[0]!==positions[0] || _animationPositions[1]!==positions[1]) {
			_animationPositions = positions;

			if (_animationTime===-1) {
				_animationTime = Date.now()+Math.min(300, Math.max(100, Math.ceil(Math.abs(scrolled.y - positions[1])/3)));
			}

			_animation && _animation.stop();
			_animation = new goog.fx.dom.Scroll(
				goog.dom.getDocumentScrollElement(),
				[scrolled.x, scrolled.y],
				positions,
				Math.max(1, _animationTime-Date.now())
			);

			goog.events.listen(_animation, goog.fx.Animation.EventType.END, _animationEnd);
			_animation.play();
		}
	}

	_animationFrame();
}

var _whichAnimationEvent;
var _whichTransitionEvent;

exports.animateOnce = function($el, animation, fn) {
	doOnce($el, _whichAnimationEvent = _whichAnimationEvent||whichEvent(animations), animation, fn);
}

exports.transiteOnce = function($el, transition, fn) {
	doOnce($el, _whichTransitionEvent = _whichTransitionEvent||whichEvent(transitions), transition, fn);
}

function doOnce($el, event, value, fn) {
	if (event) {
		var _end;
		_end = function() {
			$el.style[event[0]] = '';
			$el.removeEventListener(event[1], _end);
			fn && fn();
		}

		$el.addEventListener(event[1], _end);
		$el.style[event[0]] = value;
	}
}

var animations = {
  'animation': ['animation', 'animationend'],
  'OAnimation': ['oAnimation', 'oAnimationEnd'],
  'MozAnimation': ['animation', 'animationend'],
  'WebkitAnimation': ['webkitAnimation', 'webkitAnimationEnd']
}

var transitions = {
  'transition': ['transition', 'transitionend'],
  'OTransition': ['oTransition', 'oTransitionEnd'],
  'MozTransition': ['transition', 'transitionend'],
  'WebkitTransition': ['webkitTransition', 'webkitTransitionEnd']
}

/* From Modernizr */
function whichEvent(styles){
    var el = document.createElement('fakeelement');

    for (var t in styles) {
        if (el.style[t] !== undefined) {
            return styles[t];
        }
    }
}
