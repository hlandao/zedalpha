var gulp = require('gulp');
var fs = require('fs');
var awspublish = require('gulp-awspublish');
var awsDetails = JSON.parse(fs.readFileSync('./.ignored/aws.json'));

var awsPublisherStaging = awspublish.create({
    key: awsDetails.key,
    secret: awsDetails.secret,
    bucket: awsDetails.bucketStaging
});

var awsPublisherStaging1 = awspublish.create({
    key: awsDetails.key,
    secret: awsDetails.secret,
    bucket: awsDetails.bucketStaging1
});

var awsPublisherProduction = awspublish.create({
    key: awsDetails.key,
    secret: awsDetails.secret,
    bucket: awsDetails.bucketProduction
});

var awsHeaders = { 'Cache-Control': 'max-age=315360000, no-transform, public' };

console.log('awsDetails',awsDetails);

// aws staging deployment
gulp.task('deploy:staging', function(){
    return gulp.src('./dist/**')

        .pipe(awsPublisherStaging.publish(awsHeaders))
        .pipe(awsPublisherStaging.sync())  // sync local directory with bucket
        //.pipe(awsPublisher.cache()) // create a cache file to speed up next uploads
        .pipe(awspublish.reporter()); // print upload updates to console
});

// aws staging1 deployment
gulp.task('deploy:staging1',['build'], function(){
    return gulp.src('./dist/**')
        .pipe(awsPublisherStaging1.publish(awsHeaders))
        .pipe(awsPublisherStaging1.sync())  // sync local directory with bucket
        //.pipe(awsPublisher.cache()) // create a cache file to speed up next uploads
        .pipe(awspublish.reporter()); // print upload updates to console
});

// aws production deployment
gulp.task('deploy:production',['build'], function(){
    return gulp.src('./dist/**')
        .pipe(awsPublisherProduction.publish(awsHeaders))
        .pipe(awsPublisherProduction.sync())  // sync local directory with bucket
        //.pipe(awsPublisher.cache()) // create a cache file to speed up next uploads
        .pipe(awspublish.reporter()); // print upload updates to console
});

