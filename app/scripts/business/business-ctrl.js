//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('BusinessCtrl', function($scope, Business, BusinessHolder ,BusinessMetaData){

        // get business meta data
        $scope.businessMetaData = BusinessMetaData;
        // get business data from business holder
        $scope.business = BusinessHolder.$business;
        $scope.businessId = BusinessHolder.businessId;



        $scope.create = function(newBusiness){
            Business.create(newBusiness).then(function(ref){
                $location.path('business/' + ref.name());
            }, function(){

            });
        };
    });