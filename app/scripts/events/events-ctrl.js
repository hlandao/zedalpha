//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('EventsCtrl', function($scope, DateHolder, EventsHolder, Event, $filter, EventsStatusesHolder,EventsDurationHolder, EventsLogic,TimelyFilteredEvents, ShiftsDayHolder, Localizer, $filter, DateHelpers, areYouSureModalFactory){
        Localizer.setLocale('he');

        var OccasionalEvent = _.findWhere(EventsStatusesHolder, {status : 'OCCASIONAL'}),
            OrderedEvent = _.findWhere(EventsStatusesHolder, {status : 'ORDERED'}),
            eventWatcher,
            editedEvent,
            justRevertedWhileEdit;

        $scope.EventsDurationHolder = EventsDurationHolder;
        $scope.DateHolder = DateHolder;
        $scope.ShiftsDayHolder = ShiftsDayHolder;

        // --------- New event ----------- //
        $scope.newEventWithSeatsDic = function(occasionalOrDestination, dic, specificStartTime){
            var isOccasional = occasionalOrDestination == 'occasional';
            var startTime = specificStartTime || (isOccasional ? new Date() : DateHolder.current);
            startTime = DateHelpers.resetDateSeconds(startTime);
            var newEvent = new Event({
                isOccasional : isOccasional,
                seats : dic,
                startTime : startTime,
                status : isOccasional ? OccasionalEvent : OrderedEvent,
                name : isOccasional ? $filter('translate')('OCCASIONAL') : '',
                createdAt : new Date()
            });
            var maxDuration = EventsLogic.maxDurationForEventInMinutes(newEvent);
            if(maxDuration == 0){
                alert('Error : cannot start event at ' + moment(startTime).format('HH:mm'));
                return false;
            }else{
                newEvent.endTime = DateHelpers.resetDateSeconds(EventsLogic.endTimeForNewEventWithStartTimeAndMaxDuration(startTime, maxDuration));
            }

            justRevertedWhileEdit = false;
            if(angular.isFunction(eventWatcher)) eventWatcher();
            eventWatcher = $scope.$watch('newEvent', eventWatching,true);
            $scope.newEvent = newEvent;
        };

        $scope.saveNewEvent = function(eventToSave){
            var isInvalid = EventsLogic.isInvalidEventBeforeSave(eventToSave);
            if(isInvalid && isInvalid.error){
                var localizedError = $filter('translate')(isInvalid.error);
                console.error('error',isInvalid.error);
                alert(localizedError);
            }else if(isInvalid && isInvalid.warning){
                var modal = areYouSureModalFactory(null, 'INVALID_GUESTS_PER_15_WARNING');
                modal.result.then(function () {
                    saveNewEventAfterValidation(eventToSave);
                }, function () {
                    console.debug('Modal dismissed at: ' + new Date());
                });
            }else{
                saveNewEventAfterValidation(eventToSave);
            }
        };

        var saveNewEventAfterValidation = function(eventToSave){
            if(angular.isFunction(eventWatcher)) eventWatcher();
            var cloned = angular.copy(eventToSave);
            delete cloned.helpers;
            EventsHolder.$allEvents.$add(cloned);
            $scope.newEvent = null;
        }

        $scope.closeNewEvent = function(){
            if(angular.isFunction(newEventWatcher)) newEventWatcher();
            $scope.newEvent=null;
        };

        var eventWatching = function(newVal, oldVal){
            if(justRevertedWhileEdit){
                justRevertedWhileEdit = false;
                return;
            }
            if(newVal){
                var isInvalid = EventsLogic.isInvalidEventWhileEdit(newVal);
                if(isInvalid && isInvalid.error){
                    console.error('[EventsCtrl]: error while edit event', isInvalid.error);
                    var localizedError = $filter('translate')(isInvalid.error);
                    alert(localizedError);
                    justRevertedWhileEdit = true;
                    newVal.startTime =  oldVal.startTime;
                    newVal.endTime =  oldVal.endTime;
                    newVal.seats =  oldVal.seats;
                }
            }
        };



        // --------- Edit event ----------- //
        $scope.openEditedEvent = function (event){
            if($scope.editedEvent == event){
                return;
            }else if(editedEvent){
                $scope.closeEditedEvent(editedEvent);
            }
            event.helpers = event.helpers || {};
            event.helpers.isEditing = true;
            editedEvent = angular.copy(event);
            $scope.isEditingEvent = true;
            $scope.editedEvent = event;
            justRevertedWhileEdit = false;
            if(angular.isFunction(eventWatcher)) eventWatcher();
            eventWatcher = $scope.$watchCollection(function(){ return event; },eventWatching,true);
        };


        $scope.closeEditedEvent = function(event){
            $scope.isEditingEvent = false;
            angular.extend(event, editedEvent);
            editedEvent = null;
            event.helpers = event.helpers || {};
            event.helpers.isEditing = false;
            $scope.editedEvent = null;
            if(angular.isFunction(eventWatcher)) eventWatcher();
        };

        $scope.deleteEditedEvent = function(event){

        };

        $scope.saveEditedEvent = function(eventToSave){
            var isInvalid = EventsLogic.isInvalidEventBeforeSave(eventToSave);
            if(isInvalid && isInvalid.error){
                var localizedError = $filter('translate')(isInvalid.error);
                alert(localizedError);
            }else if(isInvalid && isInvalid.warning){
                var modal = areYouSureModalFactory(null, isInvalid.warning);
                modal.result.then(function () {
                    saveEditedEventAfterValidation(eventToSave);
                }, function () {
                });
            }else{
                saveEditedEventAfterValidation(eventToSave);
            }
        };


        var saveEditedEventAfterValidation = function(eventToSave){
            delete eventToSave.helpers;
            var $event = EventsHolder.$allEvents.$child(eventToSave.$id);
            $event.$set(eventToSave);
            if(eventToSave.helpers) eventToSave.helpers.isEditing = false;
            $scope.isEditingEvent = false;
            $scope.editedEvent = null;

        }



        $scope.eventStatusChanged = function(event){
            $scope.saveEditedEvent(event);
        };

        $scope.removeEvent = function(eventToRemove){
            EventsHolder.$allEvents.$remove(eventToRemove.$id);
            $scope.isEditingEvent = false;
            $scope.editedEvent = null;
        }



        $scope.filters = ['ALL','SEATED','ORDERED','OCCASIONAL'];
        $scope.selectedFilter = $scope.filters[0];

        $scope.selectFilter = function(filter){
            $scope.selectedFilter = filter;
        };


        $scope.events = {};
        $scope.TimelyFilteredEvents = TimelyFilteredEvents;
    });