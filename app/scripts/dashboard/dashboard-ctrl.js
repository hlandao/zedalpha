'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('DashboardCtrl', function($scope, User){
        $scope.businesses = User.$userProfile().$child('businesses');
        console.log('$scope.businesses',$scope.businesses);
    });