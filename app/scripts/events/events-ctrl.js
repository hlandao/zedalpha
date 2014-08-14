//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('EventsCtrl', function($scope, $log, DateHolder, EventsHolder, Event, $filter, EventsStatusesHolder,EventsDurationHolder, EventsLogic,TimelyFilteredEvents, ShiftsDayHolder, Localizer, $filter, DateHelpers, AllDayShift, CloseOpenControls, BusinessHolder){
        var OccasionalEvent = _.findWhere(EventsStatusesHolder, {status : 'OCCASIONAL'}),
            OrderedEvent = _.findWhere(EventsStatusesHolder, {status : 'ORDERED'}),
            editedEvent;

        $scope.DateHolder = DateHolder;
        $scope.ShiftsDayHolder = ShiftsDayHolder;
        $scope.$business = BusinessHolder.$business;

        // --------- New event ----------- //
        $scope.newEventWithSeatsDic = function(occasionalOrDestination, dic, specificStartTime){
            console.log('newEventWithSeatsDic');
            if($scope.switchMode){
                var localizedError = $filter('translate')('SWITCH_EVENT_WARNING');
                alert(localizedError)
                return;
            }else if($scope.editedEvent){
                var localizedError = $filter('translate')('EDIT_EVENT_WARNING');
                alert(localizedError)
                return;
            }
            CloseOpenControls();
            var isOccasional = occasionalOrDestination == 'occasional';
            var startTime = specificStartTime || (isOccasional ? new Date() : DateHolder.currentClock);
            if(!isOccasional) startTime = EventsLogic.startTimeAccordingToTimeInterval(startTime);
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
                var errMsg = 'Error : cannot start event at ' + moment(startTime).format('HH:mm') + '(max duration = 0)';
                $log.error('[EventsCtrl]' + errMsg + ', Business ID : ' + BusinessHolder.businessId);
                alert(errMsg);
                return false;
            }else{
                newEvent.endTime = DateHelpers.resetDateSeconds(EventsLogic.endTimeForNewEventWithStartTimeAndMaxDuration(startTime, maxDuration));
            }
            $scope.newEvent = newEvent;
            if(isOccasional) $scope.goToNow();
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


        // ----------Click on event ----------//
        $scope.clickOnEvent = function(event){
            if($scope.switchMode){
                addEventToSwitchMode(event);
            }else{
                $scope.openEditedEvent(event);
            }
        }

        // --------- Edit event ----------- //
        $scope.openEditedEvent = function (event){
            CloseOpenControls();
            $scope.newEvent = null;
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
                $log.error('[EventsCtrl] error saving event',isInvalid.error);
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
        $scope.deadEvents = {};

        $scope.TimelyFilteredEvents = TimelyFilteredEvents;
        $scope.timepickerStaticOptions = [
            {label : $filter('translate')('ENTIRE_SHIFT'), value : 'ENTIRE_SHIFT'}
        ]

        $scope.dateHolderStaticCallback = function(staticVal){
            if(staticVal){
                if(staticVal === 'ENTIRE_SHIFT'){
                    DateHolder.isEntireShift = true;
                }
            }else{
                DateHolder.isEntireShift = false;
            }
        };

        $scope.goToEntireShift = function(){
            DateHolder.isEntireShift = true;
        };

        $scope.goToNow = function(e){
            if(e) e.preventDefault();
            DateHolder.goToNow();
        };

        $scope.countTotalGuestsForFilteredEvents = function(){
            if(!$scope.events || !$scope.events.events) return 0;
            var output = 0;
            for (var i in $scope.events.events){
                output += parseInt($scope.events.events[i].guests) || 0;
            }
            return output;
        };


        // --------- switch mode -------//
        $scope.toggleSwitchMode = function(){
            if(!$scope.switchMode){
                if($scope.editedEvent){
                    var localizedError = $filter('translate')('EDIT_EVENT_WARNING');
                    alert(localizedError);
                    return;
                }else if($scope.newEvent){
                    var localizedError = $filter('translate')('NEW_EVENT_WARNING');
                    alert(localizedError);
                    return;
                }
                $scope.switchMode = true;
                $scope.eventToSwitch = null;
            }else{
                $scope.switchMode = false;
                $scope.eventToSwitch = null;
            }

        }

        var addEventToSwitchMode = function(event){
            if($scope.eventToSwitch){
                if ($scope.eventToSwitch === event){
                    $scope.eventToSwitch = null;
                    return;
                }
                var validationError = EventsLogic.validateEventsSwitching($scope.eventToSwitch, event);
                if(validationError){
                    alert(validationError);
                    $scope.eventToSwitch = null;
                }else{
                    $scope.saveEvent($scope.eventToSwitch, true);
                    $scope.saveEvent(event, true);
                }
                $scope.eventToSwitch = null;
                $scope.switchMode = false;
            } else{
                $scope.eventToSwitch = event;
            }
        }



    });