
window.redirect = function(endpoint) {
	window.location.href = endpoint;
}

import './shim.js'
require('./run').default();
