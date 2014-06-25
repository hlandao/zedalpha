'use strict';

// Declare app level module which depends on filters, and services
angular.module('zedalpha',
        ['pascalprecht.translate', 'ngRoute','firebase', 'zedalpha.config', 'zedalpha.routes',  'zedalpha.controllers',
            'waitForAuth', 'routeSecurity', 'zedalpha.services', 'zedalpha.directives']
    )

    .run(['loginService', '$rootScope', 'FBURL', function(loginService, $rootScope, FBURL) {
            $rootScope.auth = loginService.init('/login');
            $rootScope.FBURL = FBURL;
    }]);

