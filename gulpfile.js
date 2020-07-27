
var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

var gulp = require('gulp')
var webpackConfig = require('./webpack/makeconfig')
var webpackBuild = require('./webpack/build')

var babel = require("@babel/core");

gulp.task('build', function(done) {
	child_process.execSync('rm -rf ./lib && cp -a ./src ./lib');
	child_process.execSync('rm -rf ./bridges && cp -a ./src-bridges ./bridges');

	process.env.NODE_ENV = 'production';

	webpackBuild(webpackConfig(false)(path.resolve('src/closure.js')))(function() {
		var file, closureFile;

		closureFile = fs.readFileSync('./dist/closure.js');
		closureFile = closureFile.toString();
		closureFile = closureFile.replace(/^[\s!]*/, '');
		closureFile = closureFile.replace(/[;\s]*$/, '');
		closureFile = closureFile.replace(/,(([a-z])\(\2\.[a-z]\=1\))/, function(_, match) { return '; return ' + match; })

		file = fs.readFileSync('./src/closure.js');
		file = babel.transform(file, {presets: [["@babel/preset-env"]]});
		file = file.code;
		file = file.replace("'use strict';", '');

		var replace = 'require("../closure")';
		var index = file.indexOf(replace);

		if (index!==-1) {
			file = file.substr(0, index) + closureFile + file.substr(index+replace.length);
		}

		fs.writeFileSync('./lib/closure.js', file);
		done();
	});
});
