'use strict';

// Declare app level module which depends on filters, and services
var angularDependencies = ['angular.css.injector', 'angularSpectrumColorpicker','ui.bootstrap','pascalprecht.translate', 'ui.router','firebase'];
var myModules = ['zedalpha.services', 'zedalpha.config', 'zedalpha.routes',  'zedalpha.controllers',
    'waitForAuth','routeSecurity', 'zedalpha.directives'];
var zedalphaModules = [].concat(angularDependencies,myModules);

angular.module('zedalpha',zedalphaModules)

    .run(['loginService', '$rootScope', 'FBURL','UserHolder', '$state', function(loginService, $rootScope, FBURL, UserHolder, $state) {
            $rootScope.auth = loginService.init();
            $rootScope.FBURL = FBURL;
//            $state.reload();
    }]);


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
