
goog.module('base64');

goog.require('goog.crypt');
goog.require('goog.crypt.base64');


exports.encode = function(str) {
	return goog.crypt.base64.encodeByteArray(goog.crypt.stringToUtf8ByteArray(str));
}


exports.decode = function(str) {
	var output = goog.crypt.base64.decodeStringToByteArray(str);
	return output.map(function(b) { return String.fromCharCode(b); }).join('');
}
