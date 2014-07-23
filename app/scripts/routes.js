//"use strict";
var ISDEBUG = false;
angular.module('zedalpha.routes', [])

    // configure views; the authRequired parameter is used for specifying pages
    // which should only be available while logged in
    .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

        if(ISDEBUG){
            var userHolderResolver = function(){
                return true
            };

            var businessResolver = function(){
                return true;
            };

        }else{
            var userHolderResolver = function(UserHolder){
                return UserHolder.promise();
            };

            var businessResolver = function(UserHolder, BusinessHolder, $stateParams, $q){
                var defer = $q.defer();
                return UserHolder.promise().then(function(){
                    return BusinessHolder.init($stateParams.businessId).then(function(){
                        defer.resolve();
                    });
                });
                return defer.promise;
            };
        }



        $stateProvider
            .state('home',{
                url : '/',
                views : {
                    "header" : {
                    },
                    "nav" : {
                    },
                    "main" : {
                        templateUrl: '/partials/home/home.html',
                        controller: 'LoginCtrl'
                    }
                },
                isSpecificPage : true,
                authRequired : false
            });


        $stateProvider.state('dashboard',{
            authRequired: true,
            isSpecificPage : true,
            url : '/dashboard',
            views : {
                "header" : {
                },
                "nav" : {
                },
                "main" : {
                    templateUrl: '/partials/business/list-business.html',
                    controller : 'BusinessesCtrl'
                }
            },
            resolve : {
                userHolder : userHolderResolver
            }
        }).state('new-business', {
                isSpecificPage : true,
                authRequired: true,
                url : '/business/new',
                templateUrl: '/partials/business/new-business.html',
                controller: 'BusinessCtrl',
                resolve : {
                    businessResolver : businessResolver
                }

        }).state('business',{
                authRequired: true,
                url : '/business',
                abstract : true,
                views : {
                    "header" : {
                        templateUrl : "/partials/header-business.html",
                        controller: "BusinessNavCtrl"
                    },
                    "nav" : {
                        templateUrl : "/partials/nav-business.html",
                        controller: "BusinessNavCtrl"
                    },
                    "main" : {
                        template : "<ui-view/>"
                    }
                }
        }).state('business.show', {
            url : '/:businessId',
            templateUrl: '/partials/business/show-business.html',
            controller: 'BusinessCtrl',
            resolve : {
                businessResolver : businessResolver
            }
        }).state('business.map', {
                url : '/:businessId/map',
                templateUrl: '/partials/business/map-business.html',
                controller: 'BusinessCtrl',
                resolve : {
                    businessResolver : businessResolver
                }
        }).state('business.shifts',{
                url : '/:businessId/shifts',
                templateUrl: '/partials/business/shifts-business.html',
                controller: 'BusinessCtrl',
                resolve : {
                    businessResolver : businessResolver
                }
        }).state('business.eventsStatuses',{
                url : '/:businessId/eventsStatuses',
                templateUrl: '/partials/business/events-statuses-business.html',
                controller: 'EventsStatusesCtrl',
                resolve : {
                    businessResolver : businessResolver
                }
        }).state('business.eventsDuration',{
            url : '/:businessId/eventsDuration',
            templateUrl: '/partials/business/events-duration-business.html',
            controller: 'EventsDurationCtrl',
            resolve : {
                businessResolver : businessResolver
            }

        }).state('events', {
            abstract : true,
            authRequired: true,
            views : {
                "navigation" : {
                    template : ""
                },
                "main" : {
                    templateUrl : "/partials/events/events.html"
                }
            }
        }).state('events.show',{
                url : '/events/:businessId',
                views: {
                    'header@dashboard.events' : {
                        templateUrl: '/partials/events/header.html',
                        controller: 'EventsNavigationCtrl'
                    },
                    'map@dashboard.events': {
                        templateUrl: '/partials/events/map.html'
//                        controller: 'MapCtrl'
                    },
                    'events-list@dashboard.events': {
                        templateUrl: '/partials/events/events-list.html'
//                        controller: 'EventsListCtrl'
                    }
                },
                resolve : {
                    businessResolver : businessResolver
                }
        }).state('eventstest', {
                abstract : true,
                templateUrl : "/partials/events/events.html"
        }).state('eventstest.all', {
                url : '/eventstest/all',
                views: {
                    'header@eventstest' : {
                        templateUrl: '/partials/events/header.html',
                        controller: 'EventsNavigationCtrl'
                    },
                    'map@eventstest': {
                        templateUrl: '/partials/events/map.html'
//                        controller: 'MapCtrl'
                    },
                    'events-list@eventstest': {
                        templateUrl: '/partials/events/events-list.html'
//                        controller: 'EventsListCtrl'
                    }
                }
            });





        $urlRouterProvider.otherwise("/");

    }]);
