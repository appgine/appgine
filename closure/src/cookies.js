
goog.module('cookies');

goog.require('goog.net.cookies');


exports.get = goog.net.cookies.get.bind(goog.net.cookies);
exports.set = goog.net.cookies.set.bind(goog.net.cookies);
