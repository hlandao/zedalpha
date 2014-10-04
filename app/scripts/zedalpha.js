//'use strict';

// Declare app level module which depends on filters, and services
var angularDependencies = [
    'angular.css.injector',
    'angularSpectrumColorpicker',
    'ui.bootstrap',
    'pascalprecht.translate',
    'ui.router',
    'firebase',
    'ngLoggly',
    'ngTouch'
];

var myModules = [
    'zedalpha.services',
    'zedalpha.config',
    'zedalpha.routes',
    'zedalpha.controllers',
    'zedalpha.waitForAuth',
    'zedalpha.routeSecurity',
    'zedalpha.directives',
    'zedalpha.filters'
];

var zedalphaModules = [].concat(angularDependencies,myModules);

angular.module('zedalpha',zedalphaModules)

    .run(['loginService', '$rootScope', 'FBURL','UserHolder', '$state','Localizer', function(loginService, $rootScope, FBURL, UserHolder, $state,Localizer) {
            $rootScope.auth = loginService.init();
            $rootScope.FBURL = FBURL;
            $rootScope.safeApply = function(fn) {
                var phase = this.$root.$$phase;
                if(phase == '$apply' || phase == '$digest') {
                    if(fn && (typeof(fn) === 'function')) {
                        fn();
                    }
                } else {
                    this.$apply(fn);
                }
            };
    }])
    .config( function( LogglyLoggerProvider, LOGGLY_KEY) {
        LogglyLoggerProvider.inputToken(LOGGLY_KEY );
    }).factory('asyncThrow', function(){
        return function(err){

            if (!(err instanceof Error)) {
                err =  new Error(err);
            }
            setTimeout(function () { throw err; }, 0);
        }
    }).config(function($provide) {
        $provide.decorator('$exceptionHandler', ['$log', '$delegate',
            function ($log, $delegate) {
                return function (exception, cause) {
                    $delegate(exception, cause);
                };
            }
        ]);
    });


Function.prototype.inheritsFrom = function( parentClassOrObject ){
    if ( parentClassOrObject.constructor == Function )
    {
        //Normal Inheritance
        this.prototype = new parentClassOrObject;
        this.prototype.constructor = this;
        this.prototype.parent = parentClassOrObject.prototype;
    }
    else
    {
        //Pure Virtual Inheritance
        this.prototype = parentClassOrObject;
        this.prototype.constructor = this;
        this.prototype.parent = parentClassOrObject;
    }
    return this;
}


function isEmptyObject(obj) {
    for(var prop in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
            return false;
        }
    }
    return true;
}
