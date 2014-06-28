'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('BusinessNavCtrl', function($scope, BusinessHolder){
        // check if ID is available
        $scope.$on('$stateChangeSuccess', function(e, toState, toParams){
            if(toParams.businessId){
                // get business data from business holder
                $scope.business = BusinessHolder.$business;
                $scope.businessId = BusinessHolder.businessId;
            }
        })

    });