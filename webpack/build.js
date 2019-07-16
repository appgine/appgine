
var webpack = require('webpack')

module.exports = function(webpackConfig) {
	return function(done) {
		webpack(webpackConfig, function(fatalError, stats) {
			var jsonStats = stats.toJson()
			var buildError = fatalError || jsonStats.errors[0] || jsonStats.warnings[0]

			if (buildError) {
				throw new Error(buildError)
			}

			console.log('[webpack]', stats.toString({
				colors: true,
				version: false,
				hash: false,
				timings: false,
				chunks: false,
				chunkModules: false
			}))

			done()
		})
	}
}
