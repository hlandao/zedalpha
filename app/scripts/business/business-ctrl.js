'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('BusinessCtrl', function($scope, firebaseRef, $firebase, Business,$location, $routeParams, User){
        // check if ID is available
        if($routeParams.businessId){
            $scope.businessId = $routeParams.businessId;
            $scope.business = User.$userProfile().$child('businesses').$child($routeParams.businessId);
        }
        // get business meta data
        var businessMetaDataRef = firebaseRef('businessMetaData');
        $scope.businessMetaData = $firebase(businessMetaDataRef);



        $scope.create = function(newBusiness){
            Business.create(newBusiness).then(function(ref){
                $location.path('business/' + ref.name());
            }, function(){

            });
        };
    })
    .controller('BusinessMapEditorCtrl', function($scope, $routeParams, User){

    });