'use strict';

// Declare app level module which depends on filters, and services
angular.module('zedalpha',
        ['ui.bootstrap','pascalprecht.translate', 'ngRoute','firebase', 'zedalpha.config', 'zedalpha.routes',  'zedalpha.controllers',
            'waitForAuth', 'routeSecurity', 'zedalpha.services', 'zedalpha.directives']
    )

    .run(['loginService', '$rootScope', 'FBURL', function(loginService, $rootScope, FBURL) {
            $rootScope.auth = loginService.init('/login');
            $rootScope.FBURL = FBURL;
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
