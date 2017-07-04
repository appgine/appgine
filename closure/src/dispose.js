
goog.module('dispose');

var disposeList = [];

exports.register = function(fn) {
	disposeList.push(fn);
}

exports.dispose = function() {
	disposeList.forEach(fn => fn());
	disposeList = [];
}
