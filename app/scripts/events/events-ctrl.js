//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('EventsCtrl', function($scope, DateHolder, EventsHolder, Event, $filter, EventsStatusesHolder,EventsDurationHolder, EventsLogic,TimelyFilteredEvents, ShiftsDayHolder, Localizer, $filter, DateHelpers, AllDayShift){
        Localizer.setLocale('he');

        var OccasionalEvent = _.findWhere(EventsStatusesHolder, {status : 'OCCASIONAL'}),
            OrderedEvent = _.findWhere(EventsStatusesHolder, {status : 'ORDERED'}),
            eventWatcher,
            editedEvent,
            justRevertedWhileEdit;

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
                createdAt : new Date(),
                helpers : {
                    isEditing : true
                }
            });
            var maxDuration = EventsLogic.maxDurationForEventInMinutes(newEvent);
            if(maxDuration == 0){
                alert('Error : cannot start event at ' + moment(startTime).format('HH:mm'));
                return false;
            }else{
                newEvent.endTime = DateHelpers.resetDateSeconds(EventsLogic.endTimeForNewEventWithStartTimeAndMaxDuration(startTime, maxDuration));
            }
            $scope.newEvent = newEvent;
            console.log('$scope.newEvent',$scope.newEvent);
        };


        $scope.$watch('newEvent.helpers.isEditing', function(newVal){
            if(!newVal){
                $scope.newEvent=null;
            }
        });

        $scope.$watch('editedEvent.helpers.isEditing', function(newVal){
            if(!newVal){
                $scope.editedEvent=null;

            }
        });


        // --------- Edit event ----------- //
        $scope.openEditedEvent = function (event){
            if($scope.editedEvent == event){
                return;
            }else if($scope.editedEvent){
                delete $scope.editedEvent.helpers
            }
            event.helpers = event.helpers || {};
            event.helpers.isEditing = true;
            $scope.editedEvent = event;
        };


        $scope.eventStatusChanged = function(event){
            $scope.saveEvent(event);
        };

        $scope.saveEvent = function(eventToSave, withWarnings){
            var isInvalid = EventsLogic.isInvalidEventBeforeSave(eventToSave);
            if(isInvalid && isInvalid.error){
                var localizedError = $filter('translate')(isInvalid.error);
                console.error('error',isInvalid.error);
                alert(localizedError);
            }else if(withWarnings && isInvalid && isInvalid.warning){
                var modal = areYouSureModalFactory(null, 'INVALID_GUESTS_PER_15_WARNING');
                modal.result.then(function () {
                    saveAfterValidation(eventToSave);
                }, function () {
                });
            }else{
                saveAfterValidation(eventToSave);
            }
        };

        var saveAfterValidation = function(eventToSave){
            if(eventToSave.$id){
                var $event = EventsHolder.$allEvents.$child(eventToSave.$id);
                $event.$set(eventToSave);
            }
        }


        $scope.filters = ['ALL','SEATED','ORDERED','OCCASIONAL'];
        $scope.selectedFilter = $scope.filters[0];

        $scope.selectFilter = function(filter){
            $scope.selectedFilter = filter;
        };

        $scope.selectAllDayShift = function(){
            ShiftsDayHolder.selected = AllDayShift();
        }


        $scope.events = {};
        $scope.TimelyFilteredEvents = TimelyFilteredEvents;
    });