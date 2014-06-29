'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('EventsCtrl', function($scope, DateHolder, EventsHolder, Event, $filter, EventsStatusesHolder, EventsLogic){
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

        $scope.saveEvent = function(eventToSave){

            EventsHolder.$add(eventToSave);
        };

        $scope.closeNewEvent = function(){
            $scope.newEvent=null;
        };

        $scope.$watch('newEvent', function(newVal, oldVal){
            if(newVal){
                var error = EventsLogic.isInValidateEventWhileEdit(newVal);
                if(error){
                    console.error('[EventsCtrl]: error while edit event', error);
                    newVal = oldVal;
                }
            }
        });

        $scope.filters = ['all','seating','ordered','occasional'];
        $scope.selectedFilter = $scope.filters[0];

    });