//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('BusinessesCtrl', function($scope, BusinessesCollectionGenerator){
        $scope.showSpinner = true;

        $scope.businesses = BusinessesCollectionGenerator()

        $scope.businesses.$loaded().then(function(){
            $scope.showSpinner = false;
        })
    });