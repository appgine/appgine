
goog.module('scroll');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.style');
goog.require('goog.dom');
goog.require('goog.dom.classes');


var doc = document;
var docEl = doc.documentElement||{};

exports.scrollTop = function() {
	return Math.max(window.pageYOffset||0, window.scrollY||0, doc.body.scrollTop||0, docEl.scrollTop||0);
}

exports.scrollLeft = function() {
	return Math.max(window.pageXOffset||0, window.scrollX||0, doc.body.scrollLeft||0, docEl.scrollLeft||0);
}

exports.scrollHeight = function() {
	return Math.max(doc.body.scrollHeight||0, docEl.scrollHeight||0) - goog.dom.getViewportSize().height;
}

exports.scrollWidth = function() {
	return Math.max(doc.body.scrollWidth||0, docEl.scrollWidth||0) - goog.dom.getViewportSize().width;
}

exports.getDocumentScrollElement = goog.dom.getDocumentScrollElement;


var binded = false;
var inited = 0;
var instances = [];
var className = '';


function create(inst) {
	instances.push(inst);

	if (binded===false) {
		binded = true;

		goog.events.listen(window, goog.events.EventType.BEFOREUNLOAD, function(e) {
			instances.map(function(inst) {
				inst.store();
			});
		});

		goog.events.listen(doc.body, goog.events.EventType.MOUSEOVER, function(e) {
			if (inited===true) {
				inited = 0;
				goog.style.setStyle(doc.body, 'overflow', 'auto');

				if (className) {
					goog.dom.classes.remove(doc.getElementById('wrapper'), className);
					className = '';
				}

				instances.map(function(inst) {
					inst.inited = false;
				});
			}
		});
	}
}

function remove(inst) {
	instances.splice(instances.indexOf(inst), 1);
}


exports.load = function($element, name) {
	var inst = new Scroller($element, name);
	create(inst);

	return function() {
		inst.dispose();
		remove(inst);
	}
};


/**
 * @constructor
 */
function Scroller($element, name) {
	this.$element = $element;
	this.inited = 0;
	this.storage = window['sessionStorage']
	this.pending = null;
	this.key = (this.storage && name) ? 'scroll:' + name : '';
	this.mouseOut = this.mouseOut.bind(this);
	this.mouseOver = this.mouseOver.bind(this);

	this.key && (this.$element.scrollTop = parseInt(this.storage.getItem(this.key), 10));
	this.key && goog.events.listen(this.$element, goog.events.EventType.MOUSEOUT, this.mouseOut);
	goog.events.listen(this.$element, goog.events.EventType.MOUSEOVER, this.mouseOver);
};


Scroller.prototype.dispose = function() {
	this.key && goog.events.unlisten(this.$element, goog.events.EventType.MOUSEOUT, this.mouseOut);
	goog.events.unlisten(this.$element, goog.events.EventType.MOUSEOVER, this.mouseOver)
};


Scroller.prototype.store = function() {
	this.storage.setItem(this.key, this.$element.scrollTop);
};


Scroller.prototype.mouseOver = function(e) {
	if (this.inited!==true && Date.now()-this.inited>16) {
		this.inited = Date.now();

		if (this.$element.scrollHeight > this.$element.clientHeight) {
			var widthStart = docEl.clientWidth || doc.body.clientWidth;
			goog.style.setStyle(doc.body, 'overflow', 'hidden');
			var widthEnd = docEl.clientWidth || doc.body.clientWidth;

			if (widthEnd-widthStart) {
				className = 'scrollbar-' + (widthEnd-widthStart);
				goog.dom.classes.add(doc.getElementById('wrapper'), className);
			}

			this.inited = inited = true;
		}
	}

	e.stopPropagation();
	return false;
}


Scroller.prototype.mouseOut = function(e) {
	clearTimeout(this.pending);
	this.pending = setTimeout(this.store.bind(this), 200);
}
