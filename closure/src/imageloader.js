
goog.module('imageloader');


exports = function(src, timeout, fn) {
	var loader = new ImageLoader(src, timeout, fn);
	return loader.abort.bind(loader);
}


/**
 * @param {string}
 * @param {int=}
 * @param {function}
 * @constructor
 */
function ImageLoader(src, timeout, fn) {
	this.src = src;
	this.fn = goog.isFunction(timeout) ? timeout : fn;
	this.progress = false;

	if (timeout && goog.isNumber(timeout)) {
		var self = this;
		this.timeout = setTimeout(this.timeout.bind(this), timeout);
		this.loadXhr();

	} else {
		this.loadImage();
	}
}


ImageLoader.prototype.loadXhr = function() {
	var self = this;
	this.xhr = new XMLHttpRequest();

	this.xhr.onload = this.loadImage.bind(this);
	this.xhr.onerror = this.loadImage.bind(this);
	this.xhr.onprogress = function(e) {
		if (e.loaded>0) self.progress = true;
	};

	this.xhr.open('GET', this.src, true);
	this.xhr.send();
}


ImageLoader.prototype.loadImage = function() {
	this.image = new Image();

	this.image.onload = this.onLoad.bind(this);
	this.image.onerror = this.onLoad.bind(this);
	this.image.src = this.src;
}


ImageLoader.prototype.onLoad = function(e) {
	this.fn.apply(null, [e.target.naturalWidth||0, e.target.naturalHeight||0]);
	this.dispose();
}


ImageLoader.prototype.timeout = function() {
	if (this.progress===false && this.xhr) {
		this.xhr.abort();

		if (!this.image) {
			this.dispose();
		}
	}
}


ImageLoader.prototype.abort = function() {
	if (this.xhr) {
		this.xhr.abort();
	}

	this.dispose();
}


ImageLoader.prototype.dispose = function() {
	if (this.xhr) {
		this.xhr.onload = this.xhr.onerror = this.xhr.onprogress = null;
		this.xhr = null;
	}

	if (this.image) {
		this.image.onload = this.image.onerror = null;
		this.image = null;
	}
}
