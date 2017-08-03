

goog.module('md5');

goog.require('goog.crypt');
goog.require('goog.crypt.Md5');


var md5;
exports = function(str) {
	md5 = md5 || new goog.crypt.Md5();
	md5.reset();
	md5.update(String(str));
	return goog.crypt.byteArrayToHex(md5.digest());
}
