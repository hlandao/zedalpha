'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('EventsCtrl', function($scope, DateHolder, EventsHolder, Event, $filter, EventsStatusesHolder,EventsDurationHolder, EventsLogic){
        var OccasionalEvent = _.findWhere(EventsStatusesHolder, {status : 'OCCASIONAL'});
        var OrderedEvent = _.findWhere(EventsStatusesHolder, {status : 'ORDERED'});

        $scope.EventsDurationHolder = EventsDurationHolder;
        $scope.newEventWithSeatsDic = function(occasionalOrDestination, dic){
            var isOccasional = occasionalOrDestination == 'occasional';
            var startTime = isOccasional ? new Date() : DateHolder.current;
            var endTime = EventsLogic.endTimeForNewEventWithStartTime(startTime);
            $scope.newEvent = new Event({
                isOccasional : isOccasional,
                seats : dic,
                startTime : startTime,
                endTime : endTime,
                status : isOccasional ? OccasionalEvent : OrderedEvent,
                name : isOccasional ? $filter('translate')('OCCASIONAL') : '',
                createdAt : new Date()
            });
        };

        $scope.saveEvent = function(eventToSave){
            console.log('$scope EventsHolder',EventsHolder);
            var error = EventsLogic.isInValidateEventBeforeSave(eventToSave);
            if(error){
                alert(error);
            }else{
                EventsHolder.today.$add(eventToSave);
                eventToSave = {}
            }

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

        $scope.EventsHolder = EventsHolder;
    });