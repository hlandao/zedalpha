'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('BusinessesCtrl', function($scope, UserHolder){
        $scope.businesses = UserHolder.$userProfile.$child('businesses');
    });