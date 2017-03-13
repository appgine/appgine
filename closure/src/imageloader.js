
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
	this.progress = 0;
	this.timeoutTime = timeout && goog.isNumber(timeout) && parseInt(timeout, 10);

	if (this.timeoutTime) {
		setTimeout(this.timeout.bind(this), this.timeoutTime);
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
		self.progress = self.progress || e.loaded>0 && 1;
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
	this.fn && this.fn(e.target.naturalWidth||0, e.target.naturalHeight||0, false);
	this.dispose();
}


ImageLoader.prototype.timeout = function() {
	if (this.xhr) {
		if (this.progress===1) {
			this.progress = 2;
			setTimeout(this.timeout.bind(this), this.timeoutTime/2);

		} else {
			this.xhr.abort();
			this.fn && this.fn(0, 0, true);
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
	this.fn = null;

	if (this.xhr) {
		this.xhr.onload = this.xhr.onerror = this.xhr.onprogress = null;
		this.xhr = null;
	}

	if (this.image) {
		this.image.onload = this.image.onerror = null;
		this.image = null;
	}
}
