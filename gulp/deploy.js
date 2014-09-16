var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var fs = require('fs');
var awspublish = require('gulp-awspublish');


var awsHeaders = { 'Cache-Control': 'max-age=315360000, no-transform, public' };

// aws staging deployment
var to, envs, promptMsg,awsDetails,toEnv;
gulp.task('deploy', function(){
    awsDetails = JSON.parse(fs.readFileSync('./.ignored/aws.json'));
    to = $.util.env.to;
    envs = JSON.parse(fs.readFileSync('./.ignored/envs.json'));

    if(!to || !envs.envs[to]){
        var options = "";
        for(var i in envs.envs){
            if(options){
                options += ",";
            }
            options += i;
        }
        throw new Error("Please specify a valid environment. 'gulp deploy --to ENVIRONMENT_NAME'. ("+options+")");
    }

    toEnv = envs.envs[to];
    promptMsg = "Are you sure you want to deploy to " + to.toUpperCase() + "(bucket = "+toEnv.bucket+", firebase = "+toEnv.firebase_url+") ?";
    runSequence('deploy-prompt', 'build', 'deploy-config', 'deploy-do');
});

gulp.task('deploy-prompt', function(){
    return gulp.src('').pipe($.prompt.confirm({message : promptMsg}));
});

gulp.task('deploy-config', function(){
    return gulp
        .src('./dist/scripts/config.json')
        .pipe($.jsonEditor(function(json) {
            json.firebase_url = toEnv.firebase_url;
            return json; // must return JSON object.
        }))
        .pipe(gulp.dest("./dist/scripts/"));

});


gulp.task('deploy-do', function(){

    var publisher = awspublish.create({
        key : awsDetails.key,
        secret  : awsDetails.secret,
        bucket : toEnv.bucket
    });

    return gulp
        .src('./dist/**')
        .pipe(publisher.publish(awsHeaders))
        .pipe(publisher.sync())  // sync local directory with bucket
        //.pipe(awsPublisher.cache()) // create a cache file to speed up next uploads
        .pipe(awspublish.reporter()); // print upload updates to console
});


