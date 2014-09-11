'use strict';

var gulp = require('gulp');

var $ = require('gulp-load-plugins')();

var wiredep = require('wiredep');

gulp.task('test', function() {
  var bowerDeps = wiredep({
    directory: 'app/bower_components',
    exclude: ['bootstrap-sass-official'],
    dependencies: true,
    devDependencies: true
  });

  var testFiles = bowerDeps.js.concat([
    "test/mock.firebase.js",
    "test/mock.utils.js",
    "app/bower_components/                                                                                                                                                                               /angular-loggly-logger.js",
    'app/scripts/**/*.js',
    'test/unit/**/*.js'
  ]);


  return gulp.src(testFiles)
    .pipe($.karma({
      configFile: 'test/karma.conf.js',
      action: 'run',
      singleRun: false,
      transports: ['xhr-polling']
    }))
    .on('error', function(err) {
      // Make sure failed tests cause gulp to exit non-zero
      console.error('error with karma',err);
    });
});
