/* @flow weak */

"use strict"

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

module.exports = function() {
  var config = {
    mode: 'production',
    cache: false,
    devtool: '',
    entry: {},
    module: {
      rules: [
        {
          include: /src\/closure/,
          test: /\.jsx?$/,
          use: {
            loader: 'babel-loader'
          }
        },
        {
          include: /closure/,
          exclude: /src|lib|dist/,
          test: /\.jsx?$/,
          use: {
            loader: 'goog-loader'
          }
        },
      ]
    },
    plugins: [new webpack.DefinePlugin({'process.env.NODE_ENV': JSON.stringify('production')})],
    resolve: {
      modules: ['override', 'node_modules', 'src'],
      extensions: ['.js', '.jsx', '.json']
    },
  }

  return function() {
    var entry = {};
    [].forEach.call(arguments, function(arg) {
      entry[path.basename(arg, '.js')] = [arg];
    })

    return extend({}, config, {entry: entry});
  }
}
