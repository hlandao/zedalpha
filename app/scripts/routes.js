"use strict";

angular.module('zedalpha.routes', [])

    // configure views; the authRequired parameter is used for specifying pages
    // which should only be available while logged in
    .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
        $locationProvider.html5Mode(false);


        $routeProvider.when('/home', {
            templateUrl: 'partials/home/home.html',
            controller: 'LoginCtrl'
        });

        $routeProvider.when('/dashboard', {
            authRequired: true,
            templateUrl: 'partials/dashboard/dashboard.html',
            controller: 'DashboardCtrl'
        });


        $routeProvider.when('/business/new', {
            authRequired: true,
            templateUrl: 'partials/business/new-business.html',
            controller: 'BusinessCtrl'
        });

        $routeProvider.when('/business/:businessId/map', {
            authRequired: true,
            templateUrl: 'partials/business/map-business.html',
            controller: 'BusinessCtrl'
        });

        $routeProvider.when('/business/:businessId/shifts', {
            authRequired: true,
            templateUrl: 'partials/business/shifts-business.html',
            controller: 'BusinessCtrl'
        });

        $routeProvider.when('/business/:businessId/eventsStatuses', {
            authRequired: true,
            templateUrl: 'partials/business/events-statuses-business.html',
            controller: 'EventsStatusesCtrl'
        });

        $routeProvider.when('/business/:businessId/events', {
            authRequired: true,
            templateUrl: 'partials/events/events.html',
//            controller: 'EventsCtrl'
        });



        $routeProvider.when('/business/:businessId', {
            authRequired: true,
            templateUrl: 'partials/business/show-business.html',
            controller: 'BusinessCtrl'
        });





        $routeProvider.otherwise({redirectTo: '/home'});

    }]);
