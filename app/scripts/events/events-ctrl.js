'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('EventsCtrl', function($scope, DateHolder, EventsHolder, Event, $filter, EventsStatusesHolder,EventsDurationHolder, EventsLogic,TimelyFilteredEvents){
        var OccasionalEvent = _.findWhere(EventsStatusesHolder, {status : 'OCCASIONAL'});
        var OrderedEvent = _.findWhere(EventsStatusesHolder, {status : 'ORDERED'});

        $scope.EventsDurationHolder = EventsDurationHolder;
        $scope.DateHolder = DateHolder;
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
            console.log('error',error);
            if(error){
                console.error('error',error);

            }else{
                EventsHolder.today.$add(eventToSave);
                $scope.newEvent = {}
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


        $scope.filters = ['ALL','SEATING','ORDERED','OCCASIONAL'];
        $scope.filteredEvents = {};
        $scope.selectedFilter = $scope.filters[0];

        $scope.selectFilter = function(filter){
            $scope.selectedFilter = filter;
        }
        $scope.filteredEvents = TimelyFilteredEvents;
    });