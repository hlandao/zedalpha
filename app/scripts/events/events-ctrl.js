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
        $scope.newEventWithSeatsDic = function(occasionalOrDestination, dic, specificStartTime){
            var isOccasional = occasionalOrDestination == 'occasional';
            var startTime = specificStartTime || (isOccasional ? new Date() : DateHolder.current);
            var newEvent = new Event({
                isOccasional : isOccasional,
                seats : dic,
                startTime : startTime,
//                endTime : endTime,
                status : isOccasional ? OccasionalEvent : OrderedEvent,
                name : isOccasional ? $filter('translate')('OCCASIONAL') : '',
                createdAt : new Date()
            });
            var maxDuration = EventsLogic.maxDurationForEventInMinutes(newEvent);
            console.log('maxDuration',maxDuration);
            if(maxDuration == 0){
                if(isOccasional && !specificStartTime){
                    $scope.newEventWithSeatsDic(occasionalOrDestination, dic, DateHolder.current);
                    return;
                }

                alert('Error : cannot start event at ' + moment(startTime).format('HH:mm'));
                return false;
            }else{
                newEvent.endTime = EventsLogic.endTimeForNewEventWithStartTimeAndMaxDuration(startTime, maxDuration);
            }
            console.log('newEvent',newEvent);
            $scope.newEvent = newEvent;
        };

        $scope.saveEvent = function(eventToSave){
            var error = EventsLogic.isInValidateEventBeforeSave(eventToSave);
            if(error){
                console.error('error',error);
                alert('Error : ' + error);
            }else{
                delete eventToSave.helpers;
                EventsHolder.$allEvents.$add(eventToSave);
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
                    alert('Error : ' + error);
                    newVal.startTime=null;
                    newVal.endTime=null;
                }
            }
        },true);


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
                        alert('Error : ' + error);
                        event = oldVal;
                    }
                }
            },true);

        };

        $scope.closeEditedEvent = function(event){
            event.helpers.isEditing = false;
            $scope.isEditingEvent = false;
            if(angular.isFunction(editedEventWatcher)) editedEventWatcher();
        };

        $scope.deleteEditedEvent = function(event){

        };

        $scope.saveEditedEvent = function(eventToSave){
            var error = EventsLogic.isInValidateEventBeforeSave(eventToSave);
            if(error){
                alert('Error : ' + error);
            }else{
                delete eventToSave.helpers;
                var $event = EventsHolder.$allEvents.$child(eventToSave.$id);
                $event.$set(eventToSave);
                eventToSave.helpers.isEditing = false;
                $scope.isEditingEvent = false;
            }

        };

        $scope.eventStatusChanged = function(event){
            $scope.saveEditedEvent(event);
//            EventsHolder.$allEvents.$save();
        };



        $scope.filters = ['ALL','SEATED','ORDERED','OCCASIONAL'];
        $scope.selectedFilter = $scope.filters[0];

        $scope.selectFilter = function(filter){
            $scope.selectedFilter = filter;
        };



        $scope.events = {};
        $scope.TimelyFilteredEvents = TimelyFilteredEvents;
    });