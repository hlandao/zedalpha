'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('EventsNavigationCtrl', function($scope, DateHolder){
        $scope.DateHolder = DateHolder;
        $scope.openDatePicker = function(e){
            console.log('openDatePicker');
            e.preventDefault();
            e.stopPropagation();

            $scope.datePickerOpened = true;
        }
    });