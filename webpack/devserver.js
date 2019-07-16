
var path = require('path')
var webpack = require('webpack')
var webpackDevServer = require('webpack-dev-server')

module.exports = function(webpackConfig) {
  return function(done) {
    new webpackDevServer(webpack(webpackConfig), {
      contentBase: 'http://localhost:8888',
      hot: true,
      publicPath: webpackConfig.output.publicPath,
      // Unfortunately quiet swallows everything even error so it can't be used.
      quiet: false,
      // No info filters only initial compilation it seems.
      noInfo: true,
      // Remove console.log mess during watch.
      stats: {
        assets: false,
        colors: true,
        version: false,
        hash: false,
        timings: false,
        chunks: false,
        chunkModules: false
      }
    }).listen(8888, 'localhost', function(err) {
      if (err) {
        throw new Error('webpack-dev-server', err)
      }

      console.log('[webpack-dev-server]', 'localhost:8888/dist/[name].js')
      done()
    })
  }
}
