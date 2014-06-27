'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('BusinessCtrl', function($scope, firebaseRef, $firebase, Business,BusinessMetaData, $location, $routeParams, User, $timeout){

        // get business meta data
        $scope.businessMetaData = BusinessMetaData;
        // check if ID is available
        if($routeParams.businessId){
            Business.getBusinessWithId($routeParams.businessId).then(function($business){
                $scope.business = $business;
                $scope.businessId = $routeParams.businessId;
            });

        }



        $scope.create = function(newBusiness){
            Business.create(newBusiness).then(function(ref){
                $location.path('business/' + ref.name());
            }, function(){

            });
        };
    })
    .controller('BusinessMapEditorCtrl', function($scope, $routeParams, User){

    });