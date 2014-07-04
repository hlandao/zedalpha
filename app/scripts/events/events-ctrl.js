//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('EventsCtrl', function($scope, DateHolder, EventsHolder, Event, $filter, EventsStatusesHolder,EventsDurationHolder, EventsLogic,TimelyFilteredEvents, ShiftsDayHolder){
        var OccasionalEvent = _.findWhere(EventsStatusesHolder, {status : 'OCCASIONAL'});
        var OrderedEvent = _.findWhere(EventsStatusesHolder, {status : 'ORDERED'});

        $scope.EventsDurationHolder = EventsDurationHolder;
        $scope.DateHolder = DateHolder;
        $scope.ShiftsDayHolder = ShiftsDayHolder;

        // --------- New event ----------- //
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
            var error = EventsLogic.isInValidateEventBeforeSave(eventToSave);
            if(error){
                console.error('error',error);
            }else{
                delete eventToSave.helpers;
                EventsHolder.today.$add(eventToSave);
                $scope.newEvent = null;
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


        // --------- Edit event ----------- //

        var editedEventWatcher;
        $scope.openEditedEvent = function (event){
            event.helpers = event.helpers || {};
            event.helpers.isEditing = true;
            $scope.isEditingEvent = true;
            editedEventWatcher = $scope.$watch(function(){
                return event;
            }, function(newVal, oldVal){
                if(newVal){
                    return;
                    var error = EventsLogic.isInValidateEventWhileEdit(newVal);
                    if(error){
                        console.error('[EventsCtrl]: error while edit event', error);
                        event = oldVal;
                    }
                }
            });

        };

        $scope.closeEditedEvent = function(event){
            event.helpers.isEditing = false;
            $scope.isEditingEvent = false;
            if(angular.isFunction(editedEventWatcher)) editedEventWatcher();
        };

        $scope.deleteEditedEvent = function(event){

        };

        $scope.saveEditedEvent = function(event){

        };

        $scope.eventStatusChanged = function(event){
            EventsHolder.today.$save();
        };



        $scope.filters = ['ALL','SEATED','ORDERED','OCCASIONAL'];
        $scope.selectedFilter = $scope.filters[0];

        $scope.selectFilter = function(filter){
            $scope.selectedFilter = filter;
        };



        $scope.events = {};
        $scope.TimelyFilteredEvents = TimelyFilteredEvents;
    });