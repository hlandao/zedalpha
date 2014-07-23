//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('BodyCtrl', function($scope, $stateParams,$state, $timeout,Localizer, loginService){
        // check if ID is available
        $scope.$on('$stateChangeSuccess', function(e, toState, toParams){
            if(toState.name.indexOf("dashboard.events.") === 0){
                $scope.isEventsManagementViews = true;
            }else{
                $scope.isEventsManagementViews = false;
            }
        });

        $scope.logout = function(){
            loginService.logout();
        }

        $scope.isSpecificPage = function(){
            return $state.current.isSpecificPage;
        }


        Localizer.setLocale('en');

    }).controller('HomeCtrl', function($scope, $stateParams,$state, $timeout,Localizer, loginService){

    });