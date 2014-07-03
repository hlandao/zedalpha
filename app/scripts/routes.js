//"use strict";

angular.module('zedalpha.routes', [])

    // configure views; the authRequired parameter is used for specifying pages
    // which should only be available while logged in
    .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

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



        $stateProvider
            .state('home',{
                url : '/',
                views : {
                    "" : {
                        templateUrl: '/partials/home/home.html',
                        controller: 'LoginCtrl'
                    },
                    "navigation@home" : {
                        templateUrl: '/partials/nav-home.html'
                    }
                }
            });


        $stateProvider.state('dashboard', {
            authRequired: true,
            resolve : {
                userHolder : userHolderResolver
            },
            abstract : true,
            templateUrl : "/partials/dashboard/dashboard.html"

        }).state('dashboard.main',{
            url : '/dashboard',
            views : {
                "navigation" : {
                    templateUrl : "/partials/nav-dashboard.html"
                },
                "main" : {
                    templateUrl: '/partials/business/list-business.html',
                    controller : 'BusinessesCtrl'
                }
            },
            resolve : {
                userHolder : userHolderResolver
            }
        }).state('dashboard.business',{
                url : '/business',
                abstract : true,
                views : {
                    "navigation" : {
                        templateUrl : "/partials/nav-business.html",
                        controller: "BusinessNavCtrl"
                    },
                    "main" : {
                        template : "<ui-view/>"
                    }
                }
        }).state('dashboard.business.new', {
            url : '/new',
            templateUrl: '/partials/business/new-business.html',
            controller: 'BusinessCtrl',
            resolve : {
                businessResolver : businessResolver
            }

        }).state('dashboard.business.show', {
            url : '/:businessId',
            templateUrl: '/partials/business/show-business.html',
            controller: 'BusinessCtrl',
            resolve : {
                businessResolver : businessResolver
            }
        }).state('dashboard.business.map', {
                url : '/:businessId/map',
                templateUrl: '/partials/business/map-business.html',
                controller: 'BusinessCtrl',
                resolve : {
                    businessResolver : businessResolver
                }
        }).state('dashboard.business.shifts',{
                url : '/:businessId/shifts',
                templateUrl: '/partials/business/shifts-business.html',
                controller: 'BusinessCtrl',
                resolve : {
                    businessResolver : businessResolver
                }
        }).state('dashboard.business.eventsStatuses',{
                url : '/:businessId/eventsStatuses',
                templateUrl: '/partials/business/events-statuses-business.html',
                controller: 'EventsStatusesCtrl',
                resolve : {
                    businessResolver : businessResolver
                }
        }).state('dashboard.business.eventsDuration',{
            url : '/:businessId/eventsDuration',
            templateUrl: '/partials/business/events-duration-business.html',
            controller: 'EventsDurationCtrl',
            resolve : {
                businessResolver : businessResolver
            }

        }).state('dashboard.events', {
            abstract : true,
            views : {
                "navigation" : {
                    template : ""
                },
                "main" : {
                    templateUrl : "/partials/events/events.html"
                }
            }
        }).state('dashboard.events.show',{
                url : '/events/:businessId',
                views: {
                    'navigation@dashboard.events' : {
                        templateUrl: '/partials/events/nav.html',
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
            });





        $urlRouterProvider.otherwise("/");

    }]);
