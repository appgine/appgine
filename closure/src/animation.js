
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

	var scrolled = goog.dom.getDocumentScroll();

	if (scrolled.x!==scrollLeft || scrolled.y!==scrollTop) {
		var diff = Math.abs(scrolled.y - scrollTop);
		var time = Math.min(300, Math.max(100, Math.ceil(diff/3)));

		var animation = new goog.fx.dom.Scroll(
			document.body,
			[scrolled.x, scrolled.y],
			[scrollLeft, scrollTop],
			time
		);

		goog.events.listen(animation, goog.fx.Animation.EventType.END, onEnd||function() {});
		animation.play();

	} else if (onEnd) {
		onEnd();
	}
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
