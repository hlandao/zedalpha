//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('BodyCtrl', function($scope, $stateParams,$state, $timeout,Localizer, loginService){
        // check if ID is available
        $scope.showSpinner = true;
        $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            if (toState.resolve) {
                $scope.showSpinner = true;
            }
        });

        $scope.$on('$stateChangeSuccess', function(e, toState, toParams){
            if (toState.resolve) {
                $scope.showSpinner = false;
            }
        });

        $scope.logout = function(){
            loginService.logout();
        }

        $scope.isSpecificPage = function(){
            return $state.current.isSpecificPage;
        }

        $scope.switchLang = function(lang){
            Localizer.setLocale(lang);
        }


        Localizer.init();

    }).controller('HomeCtrl', function($scope, $stateParams,$state, $timeout,Localizer, loginService){

    });