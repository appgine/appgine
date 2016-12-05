/* @flow weak */

"use strict"

var NotifyPlugin = require('./notifyplugin')
var extend = require('extend')
var path = require('path')
var webpack = require('webpack')
var googLoader = require('goog-loader')

var googEntry = path.join(__dirname, '/../closure/index.js');
var googProvide = googLoader.init({
  closureLibrary: true,
  js: [path.join(__dirname, '/../closure')],
  entry: googEntry,
  globalObj: 'window',
});

module.exports = function(isDevelopment) {

  var config = {
    cache: isDevelopment,
    debug: isDevelopment,
    devtool: isDevelopment ? 'eval-source-map' : '',
    entry: {},
    module: {
      loaders: [{
        exclude: /node_modules|bower_components|closure/,
        loaders: ['babel-loader'],
        test: /\.jsx?$/
      }, {
        include: /src\/closure/,
        loaders: ['babel-loader'],
        test: /\.js$/
      }, {
        include: /closure/,
        exclude: /src|lib|dist/,
        loaders: ['goog-loader'],
        test: /\.js$/
      }]
    },
    output: isDevelopment ? {
      path: path.join(__dirname, '/dist/'),
      filename: '[name].js',
      publicPath: 'http://localhost:8888/dist/'
    } : {
      path: './dist/',
      filename: '[name].js'
    },
    plugins: (function() {
      var plugins = [
        new webpack.DefinePlugin({
          'process.env': {
            NODE_ENV: JSON.stringify(isDevelopment ? 'development' : 'production')
          }
        })
      ]
      if (isDevelopment)
        plugins.push(
          NotifyPlugin,
          new webpack.HotModuleReplacementPlugin(),
          // Tell reloader to not reload if there is an error.
          new webpack.NoErrorsPlugin()
        )
      else
        plugins.push(
          // Render styles into separate cacheable file to prevent FOUC and
          // optimize for critical rendering path.
          new webpack.optimize.DedupePlugin(),
          new webpack.optimize.OccurenceOrderPlugin(),
          new webpack.optimize.UglifyJsPlugin({
            compress: {
              warnings: false
            }
          })
        )
      return plugins
    })(),
    resolve: {
      modulesDirectories: ['override', 'node_modules', 'src', ''],
      extensions: ['', '.js', '.jsx', '.json']
    },
  }

  return function() {
    var entry = {};
    [].forEach.call(arguments, function(arg) {
      entry[path.basename(arg, '.js')] = isDevelopment ? [
        'webpack-dev-server/client?http://localhost:8888',
        'webpack/hot/only-dev-server',
        arg
      ] : [
        arg
      ];
    })

    return extend({}, config, {entry: entry});
  }
}
