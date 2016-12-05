
var notifier = require('node-notifier')
var path = require('path')


module.exports = function() {
  this.plugin('done', function(stats) {
    // TODO: Handle warnings as well.
    var error = stats.compilation.errors[0];

    if (error && error.error && error.error.loc) {
      notify(getLocMessage(error, error.error.loc));

    } else if (error && error.message) {
      notify(error.message);
    }
  })
}

function getLocMessage(error, loc) {
  var filePath = error.module.resource.split(path.sep)
  return [
    filePath[filePath.length - 1],
    ' at [',
    loc.line,
    ',',
    loc.column,
    ']'
  ].join('')
}

function notify(message) {
  notifier.notify({ title: 'Webpack Error', message: message });
}
