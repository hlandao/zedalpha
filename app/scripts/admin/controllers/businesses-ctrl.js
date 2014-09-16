//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('BusinessesCtrl', function($scope, BusinessesCollection){
        $scope.showSpinner = true;

        BusinessesCollection.init().then(function(_collection){
            $scope.businesses = _collection;
            $scope.showSpinner = false;
        });

    });