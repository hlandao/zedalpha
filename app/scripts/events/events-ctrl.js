//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('EventsCtrl', function($scope, DateHolder, EventsHolder, Event, $filter, EventsStatusesHolder,EventsDurationHolder, EventsLogic,TimelyFilteredEvents, ShiftsDayHolder, Localizer, $filter, DateHelpers, AllDayShift, CloseOpenControls, BusinessHolder){
//        Localizer.setLocale('he');
        var OccasionalEvent = _.findWhere(EventsStatusesHolder, {status : 'OCCASIONAL'}),
            OrderedEvent = _.findWhere(EventsStatusesHolder, {status : 'ORDERED'}),
            editedEvent;

        $scope.DateHolder = DateHolder;
        $scope.ShiftsDayHolder = ShiftsDayHolder;
        $scope.$business = BusinessHolder.$business;

        // --------- New event ----------- //
        $scope.newEventWithSeatsDic = function(occasionalOrDestination, dic, specificStartTime){
            CloseOpenControls();
            var isOccasional = occasionalOrDestination == 'occasional';
            var startTime = specificStartTime || (isOccasional ? new Date() : DateHolder.current);
            console.log('isOccasional',isOccasional);
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
                alert('Error : cannot start event at ' + moment(startTime).format('HH:mm'));
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


        // --------- Edit event ----------- //
        $scope.openEditedEvent = function (event){
            CloseOpenControls();
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
            DateHolder.current =  new Date();
        };

        $scope.countTotalGuestsForFilteredEvents = function(){
            if(!$scope.events || !$scope.events.events) return 0;
            var output = 0;
            for (var i in $scope.events.events){
                output += parseInt($scope.events.events[i].guests) || 0;
            }
            return output;
        }



    });