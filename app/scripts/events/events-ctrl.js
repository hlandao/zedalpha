//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('EventsCtrl', function($scope, DateHolder, EventsHolder, Event, $filter, EventsStatusesHolder,EventsDurationHolder, EventsLogic,TimelyFilteredEvents, ShiftsDayHolder, Localizer, $filter, DateHelpers, areYouSureModalFactory){
        Localizer.setLocale('he');

        var OccasionalEvent = _.findWhere(EventsStatusesHolder, {status : 'OCCASIONAL'});
        var OrderedEvent = _.findWhere(EventsStatusesHolder, {status : 'ORDERED'});

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

//                if(isOccasional && !specificStartTime){
//                    $scope.newEventWithSeatsDic(occasionalOrDestination, dic, DateHolder.current);
//                    return;
//                }

                alert('Error : cannot start event at ' + moment(startTime).format('HH:mm'));
                return false;
            }else{
                newEvent.endTime = DateHelpers.resetDateSeconds(EventsLogic.endTimeForNewEventWithStartTimeAndMaxDuration(startTime, maxDuration));
            }


            $scope.newEvent = newEvent;
        };

        $scope.saveEvent = function(eventToSave){
            var error = EventsLogic.isInValidateEventBeforeSave(eventToSave);
            if(error){
                var localizedError = $filter('translate')(error);
                console.error('error',error);
                alert(localizedError);
            }else{
                console.log('EventsLogic.isGuestsPer15Valid',EventsLogic.isGuestsPer15Valid);
                console.log('EventsLogic.isGuestsPer15Valid',EventsLogic.isGuestsPer15Valid(eventToSave));
                if(!EventsLogic.isGuestsPer15Valid(eventToSave)){
                    var modal = areYouSureModalFactory(null, 'INVALID_GUESTS_PER_15_WARNING');
                    modal.result.then(function () {
                        saveEventAfterValidation(eventToSave);
                    }, function () {
                        console.debug('Modal dismissed at: ' + new Date());
                    });
                }else{
                    saveEventAfterValidation(eventToSave);
                }
            }
        };

        var saveEventAfterValidation = function(eventToSave){
            var cloned = angular.copy(eventToSave);
            delete cloned.helpers;
            EventsHolder.$allEvents.$add(cloned);
            $scope.newEvent = null;

        }

        $scope.closeNewEvent = function(){
            $scope.newEvent=null;
        };

        $scope.$watch('newEvent', function(newVal, oldVal){
            if(newVal){
                var error = EventsLogic.isInValidateEventWhileEdit(newVal);
                if(error){
                    var localizedError = $filter('translate')(error);
                    console.error('[EventsCtrl]: error while edit event', error);
                    alert(localizedError);
                    newVal.startTime=oldVal.startTime;
                    newVal.endTime=oldVal.endTime;
                }
            }
        },true);


        // --------- Edit event ----------- //
        var editedEvent;
        var editedEventWatcher;
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
            var justReverted = false;
            editedEventWatcher = $scope.$watchCollection(function(){
                return event;
            }, function(newVal, oldVal){
                if(justReverted){
                    justReverted = false;
                    return;
                }
                if(newVal){
                    var error = EventsLogic.isInValidateEventWhileEdit(newVal);
                    if(error){
                        console.error('[EventsCtrl]: error while edit event', error);
                        var localizedError = $filter('translate')(error);
                        alert(localizedError);
                        justReverted = true;
                        event.startTime =  oldVal.startTime;
                        event.endTime =  oldVal.endTime;
                        event.seats =  oldVal.seats;
                    }
                }
            },true);

        };

        $scope.closeEditedEvent = function(event){
            $scope.isEditingEvent = false;
            angular.extend(event, editedEvent);
            editedEvent = null;
            event.helpers = event.helpers || {};
            event.helpers.isEditing = false;
            $scope.editedEvent = null;
            if(angular.isFunction(editedEventWatcher)) editedEventWatcher();
        };

        $scope.deleteEditedEvent = function(event){

        };

        $scope.saveEditedEvent = function(eventToSave){
            var error = EventsLogic.isInValidateEventBeforeSave(eventToSave);
            if(error){
                var localizedError = $filter('translate')(error);
                alert(localizedError);
            }else{
                delete eventToSave.helpers;
                var $event = EventsHolder.$allEvents.$child(eventToSave.$id);
                $event.$set(eventToSave);
                if(eventToSave.helpers) eventToSave.helpers.isEditing = false;
                $scope.isEditingEvent = false;
                $scope.editedEvent = null;
            }

        };

        $scope.eventStatusChanged = function(event){
            $scope.saveEditedEvent(event);
        };

        $scope.removeEvent = function(eventToRemove){
            var $event = EventsHolder.$allEvents.$child(eventToRemove.$id);
            $event.$remove();
        }



        $scope.filters = ['ALL','SEATED','ORDERED','OCCASIONAL'];
        $scope.selectedFilter = $scope.filters[0];

        $scope.selectFilter = function(filter){
            $scope.selectedFilter = filter;
        };



        $scope.events = {};
        $scope.TimelyFilteredEvents = TimelyFilteredEvents;
    });