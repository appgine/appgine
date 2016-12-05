
var path = require('path');
var fs = require('fs');
var child_process = require('child_process');
var gulp = require('gulp')
var config = require('./webpack/makeconfig')
var webpackBuild = require('./webpack/build')
var webpackDev = require('./webpack/devserver')

function runDev() {
	process.env.NODE_ENV = 'development';
	return webpackDev(config(true).apply(null, arguments));
}

function runBuild() {
	return function(callback) {
		child_process.execSync('rm -rf ./lib && ./node_modules/.bin/babel src --out-dir ./lib');

		process.env.NODE_ENV = 'production';

		webpackBuild(config(false)(path.resolve('src/closure.js')))(function() {
			var file, closureFile;

			closureFile = fs.readFileSync('./dist/closure.js');
			closureFile = closureFile.toString();
			closureFile = closureFile.replace(/^[\s!]*/, '');

			file = fs.readFileSync('./lib/closure.js');
			file = file.toString();
			file = file.replace("'use strict';", '');

			var replace = "require('../closure');";
			var index = file.indexOf(replace);

			if (index!==-1) {
				file = file.substr(0, index) + closureFile + file.substr(index+replace.length);
			}

			fs.writeFileSync('./lib/closure.js', file);
			callback();
		});
	}
}

gulp.task('default', runDev(path.resolve('src/app.js')));
gulp.task('dev', runDev(path.resolve('lib/app.js')));
gulp.task('build', runBuild());
