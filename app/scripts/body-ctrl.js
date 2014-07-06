//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('BodyCtrl', function($scope, $stateParams, $timeout,Localizer){
        // check if ID is available
        $scope.$on('$stateChangeSuccess', function(e, toState, toParams){
            if(toState.name.indexOf("dashboard.events.") === 0){
                $scope.isEventsManagementViews = true;
            }else{
                $scope.isEventsManagementViews = false;
            }
        });

        Localizer.setLocale('en');

    });