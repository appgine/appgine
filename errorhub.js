var errorhub = require('./src/errorhub');
module.exports.listen = errorhub.listen;
module.exports.dispatch = errorhub.dispatch;
module.exports.ERROR = errorhub.ERROR;
