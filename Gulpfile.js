'use strict';

var gulp = require('gulp');
var tasks = require('tollan-gulp');

gulp.task('default', function () {
	return tasks.assets().then(tasks.jshint).then(tasks.babel).done();
});

gulp.task('setWatch', function () {
	tasks.config.watch = true;
});

gulp.task('watch', ['setWatch', 'default'], function () {
	gulp.watch(tasks.config.jsWatch, function () {
		return tasks.assets().then(tasks.jshint).then(tasks.babel).done();
	});
});
