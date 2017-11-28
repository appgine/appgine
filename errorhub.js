var errorhub = require('./lib/errorhub');
module.exports.listen = errorhub.listen;
module.exports.createRavenHandler = errorhub.createRavenHandler;
