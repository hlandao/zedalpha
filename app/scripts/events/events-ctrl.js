'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('EventsCtrl', function($scope, DateHolder, EventsHolder, Event, $filter, EventsStatusesHolder){
        var OccasionalEvent = _.findWhere(EventsStatusesHolder, {status : 'OCCASIONAL'});
        var OrderedEvent = _.findWhere(EventsStatusesHolder, {status : 'ORDERED'});
        $scope.newEventWithSeatsDic = function(occasionalOrDestination, dic){
            var isOccasional = occasionalOrDestination == 'occasional';
            $scope.newEvent = new Event({
                isOccasional : isOccasional,
                seats : dic,
                startTime : isOccasional ? new Date() : DateHolder.current,
                status : isOccasional ? OccasionalEvent : OrderedEvent,
                name : isOccasional ? $filter('translate')('OCCASIONAL') : ''
            });
        };

        $scope.closeNewEvent = function(){
            $scope.newEvent=null;
        };

        $scope.filters = ['all','seating','ordered','occasional'];
        $scope.selectedFilter = $scope.filters[0];

    });