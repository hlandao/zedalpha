//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('EventsCtrl', function($scope, $log, DateHolder, EventsHolder, Event, $filter, ShiftsDayHolder, Localizer, $filter, DateHelpers, AllDayShift, CloseOpenControls, BusinessHolder){

        $scope.DateHolder = DateHolder;
        $scope.ShiftsDayHolder = ShiftsDayHolder;
        $scope.business = BusinessHolder.business;

        // --------- New event ----------- //
        $scope.newEventWithSeatsDic = function(occasionalOrDestination, seatsDic, specificStartTime){
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
            $scope.newEvent = new Event(null, {
                occasionalOrDestination : occasionalOrDestination,
                specificStartTime : specificStartTime,
                seatsDic : seatsDic

            }).then(function(){

            });

            if(isOccasional) $scope.goToNow();
        };


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
            if($scope.editedEvent === event){
                return;
            }else if($scope.editedEvent){
                $scope.editedEvent.$exitEditingMode();
            }

            event.$enterEditingMode();
            $scope.editedEvent = event;
        };


        $scope.eventStatusChanged = function(event){
            event.$saveWithValidation();
        };


        $scope.filters = ['ALL','SEATED','ORDERED','OCCASIONAL'];
        $scope.selectedFilter = $scope.filters[0];

        $scope.selectFilter = function(filter){
            $scope.selectedFilter = filter;
        };

        $scope.selectAllDayShift = function(){
            ShiftsDayHolder.selected = AllDayShift();
        }


        $scope.sortedEvents = EventsHolder.sorted;

        $scope.goToEntireShift = function(){
            DateHolder.isEntireShift = true;
        };

        $scope.goToNow = function(e){
            if(e) e.preventDefault();
            DateHolder.goToNow();
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