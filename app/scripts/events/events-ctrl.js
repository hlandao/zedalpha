'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('EventsCtrl', function($scope, DateHolder, EventsHolder, Event){
        $scope.newEventWithSeatsDic = function(dic){
            $scope.newEvent = new Event({seats : dic, startTime : DateHolder.current});
        }

        $scope.filters = ['all','seating','ordered','occasional'];
        $scope.selectedFilter = $scope.filters[0];

    });