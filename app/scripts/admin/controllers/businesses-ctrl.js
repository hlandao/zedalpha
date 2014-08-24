//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('BusinessesCtrl', function($scope, BusinessesCollection){
        $scope.showSpinner = true;
        BusinessesCollection.readyPromise.then(function(_collection){
            console.log('_collection',_collection);
            $scope.businesses = _collection;
            $scope.showSpinner = false;
        });

    });