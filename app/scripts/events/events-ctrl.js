//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .value('StatusFilters', ['ALL','SEATED','ORDERED','OCCASIONAL'])
    .controller('EventsCtrl', function($scope, $log, DateHolder, Event, $filter, ShiftsDayHolder, Localizer, $filter, DateHelpers, AllDayShift, CloseOpenControls, BusinessHolder, EventsCollection, StatusFilters){

        $scope.DateHolder = DateHolder;
        $scope.ShiftsDayHolder = ShiftsDayHolder;
        $scope.business = BusinessHolder.business;
        $scope.sortedEvents = EventsCollection.sorted;
        $scope.filters = EventsCollection.filters;



        // --------- New event ----------- //
        $scope.newEventWithSeatsDic = function(occasionalOrDestination, seatsDic, startTime){
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
            $scope.newEvent = EventsCollection.createNewEvent({
                occasionalOrDestination : occasionalOrDestination,
                startTime : startTime,
                seatsDic : seatsDic
            });
            if($scope.newEvent.isOccasional) $scope.goToNow();
        };

        $scope.closeNewEvent = function(success){
            if(success){
                DateHolder.goToClock($scope.newEvent.data.startTime);
            }
            $scope.newEvent = null;
        }



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
                $scope.editedEvent = null;
            }
            event.$enterEditingMode();
            $scope.editedEvent = event;
        };

        $scope.closeEditedEvent = function(success){
            console.log('$scope.closeEditedEvent',success);
            if(success){
                debugger;
                DateHolder.goToClock($scope.editedEvent.data.startTime);
            }
            $scope.editedEvent = null;
        }


        $scope.eventStatusChanged = function(event){
            console.log('event',event);
            EventsCollection.saveWithValidation(event).then(function(){
                console.log('Saved');
            }, function(error){
                console.log('error',error);
//                alert('Error!');
            });
        };


        $scope.StatusFilters = StatusFilters;

        $scope.selectFilter = function(filter){
            EventsCollection.filters.status = filter;
        };

        $scope.selectNewShift = function(shift, e){
            ShiftsDayHolder.$selectNewShift(shift)
        }

        $scope.selectAllDayShift = function(){
            ShiftsDayHolder.selectedShift = AllDayShift();
        }


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

        $scope.toggleDeadEvents = function(e){
            e.preventDefault();
            if($scope.showDeadEvents){
                $scope.showDeadEvents = false;
            }else{
                $scope.showDeadEvents = true;
            }
        }



    });