/**
 * @license
 * Lodash (Custom Build) lodash.com/license | Underscore.js 1.8.3 underscorejs.org/LICENSE
 * Build: `lodash include="isPlainObject" exports="node"`
 */
;(function(){function t(){}function e(t){return null!=t&&typeof t=="object"}var o=typeof self=="object"&&self&&self.Object===Object&&self,c=typeof global=="object"&&global&&global.Object===Object&&global||o||Function("return this")(),l=(o=typeof exports=="object"&&exports&&!exports.nodeType&&exports)&&typeof module=="object"&&module&&!module.nodeType&&module,n=Object.prototype,r=Function.prototype.toString,i=n.hasOwnProperty,b=n.toString,u=r.call(Object),c=c.Symbol,f=function(t,e){return function(o){
return t(e(o))}}(Object.getPrototypeOf,Object),a=c?c.toStringTag:void 0;t.isObjectLike=e,t.isPlainObject=function(t){var o;if(!(o=!e(t))){var c;if(null==t)c=void 0===t?"[object Undefined]":"[object Null]";else if(a&&a in Object(t)){o=i.call(t,a);var l=t[a];try{t[a]=void 0,c=true}catch(t){}var n=b.call(t);c&&(o?t[a]=l:delete t[a]),c=n}else c=b.call(t);o="[object Object]"!=c}return!o&&(t=f(t),null===t||(t=i.call(t,"constructor")&&t.constructor,typeof t=="function"&&t instanceof t&&r.call(t)==u))},t.VERSION="4.17.5",
l&&((l.exports=t)._=t,o._=t)}).call(this);
