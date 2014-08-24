//"use strict";
angular.module('zedalpha.routes', [])

    // configure views; the authRequired parameter is used for specifying pages
    // which should only be available while logged in
    .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

        var userHolderResolver = function(UserHolder){
            return UserHolder.readyPromise();
        };

        var businessResolver = function(UserHolder, BusinessHolder, $stateParams, $q){
            return UserHolder.readyPromise().then(function(){
                return BusinessHolder.init($stateParams.businessId).then(function(){
                });
            });
        };



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
                        templateUrl : "/partials/business/header-business.html",
                        controller: "BusinessNavCtrl"
                    },
                    "nav" : {
                        templateUrl : "/partials/business/nav-business.html",
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
            isSpecificPage : true,
            views : {
                "navigation" : {
                    template : ""
                },
                "main" : {
                    templateUrl : "/partials/events/events.html"
                }
            },
            resolve : {
                businessResolver : businessResolver
            }
        }).state('events.show',{
                isSpecificPage : true,
                url : '/events/:businessId',
                views: {
                    'header@events' : {
                        templateUrl: '/partials/events/events-header.html',
                        controller: 'EventsNavigationCtrl'
                    },
                    'map@events': {
                        templateUrl: '/partials/events/map.html'
//                        controller: 'MapCtrl'
                    },
                    'events-list@events': {
                        templateUrl: '/partials/events/events-list.html'
//                        controller: 'EventsListCtrl'
                    }
                },
                resolve : {
                    businessResolver : businessResolver
                }
        });





        $urlRouterProvider.otherwise("/");

    }]);
