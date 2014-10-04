//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('EventsCtrl', function($scope, $log, DateHolder, Event, $filter, ShiftsDayHolder, Localizer, $filter, DateHelpers, AllDayShift, CloseOpenControls, BusinessHolder, EventsCollection, StatusFilters, areYouSureModalFactory, SeatsHolder, EventsNotificationsHolder){

        $scope.DateHolder = DateHolder;
        $scope.ShiftsDayHolder = ShiftsDayHolder;
        $scope.business = BusinessHolder.business;
        $scope.sortedEvents = EventsCollection.sorted;
        $scope.filters = EventsCollection.filters;
        $scope.eventsNotifications = EventsNotificationsHolder.alert;
        $scope.showDeadEvents = false;
        $scope.StatusFilters = StatusFilters;
        $scope.searchController = { active : false};

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
            if(occasionalOrDestination == 'occasional') $scope.goToNow();
            EventsCollection.createNewEvent({
                occasionalOrDestination : occasionalOrDestination,
                startTime : startTime,
                seatsDic : seatsDic
            }).then(function(_newEvent){

                 $scope.newEvent = _newEvent;
            }).catch(function(error){

                if(error && error.error){
                    var localizedError = $filter('translate')(error.error);
                    areYouSureModalFactory(null, localizedError, {ok : true, cancel : false}, error.extra);
                }
            });
        };

        $scope.closeNewEvent = function(success){
            if(success){
                DateHolder.goToEvent($scope.newEvent);
            }
            $scope.newEvent = null;
        }



        // ----------Click on event ----------//
        $scope.clickOnEvent = function(event){
            if($scope.switchMode){
                addEventToSwitchMode(event);
            }else {
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
                alert('Cannot edit reservatin while another reservation is opened');
            }
            event.$enterEditingMode();
            $scope.editedEvent = event;
        };

        $scope.closeEditedEvent = function(success){
            if(success){
                DateHolder.goToEvent($scope.editedEvent);
            }
            $scope.editedEvent = null;
        }


        // --------- Event Status  ----------- //
        $scope.eventStatusChanged = function(event){
            EventsCollection.saveWithValidation(event, true).then(function(){
            }, function(error){
                if(error && error.error){
                    var localizedError = $filter('translate')(error.error);
                    areYouSureModalFactory(null, localizedError, {ok : true, cancel : false}, {event : error.withEvent});
                }
            });
        };


        // --------- Filters/entire shift  ----------- //
        $scope.selectFilter = function(filter){
            $scope.selectedFilter = filter;
            EventsCollection.filters.status = filter;
        };

        $scope.selectNewShift = function(shift, e){
            ShiftsDayHolder.$selectNewShift(shift)
        };

        $scope.selectAllDayShift = function(){
            ShiftsDayHolder.selectedShift = AllDayShift();
            $scope.selectFilter('ENTIRE_SHIFT');
            $scope.$emit('$requestSortEvents');
        };

        $scope.toggleEntireShift = function(){
            if(EventsCollection.filters.status === 'ENTIRE_SHIFT'){
                $scope.selectFilter('ALL');
            }else{
                $scope.selectFilter('ENTIRE_SHIFT');
            }
        }

        var cancelEntireShift = function(){
            $scope.selectFilter('ALL');
        }

        $scope.goToNow = function(e){
            if(e) e.preventDefault();
            cancelEntireShift();
            DateHolder.goToNow();
        };


        // --------- Switch mode -------//
        $scope.toggleSwitchMode = function(e){
            e.preventDefault();
            e.stopPropagation();
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
                EventsCollection.switchEventsSeatsWithValidation($scope.eventToSwitch, event)
                    .then(function(){
                        $scope.eventToSwitch = null;
                        $scope.switchMode = false;
                    }, function(error){
//                        $scope.eventToSwitch = null;
//                        $scope.switchMode = false;
                        if(error && error.error){
                            var localizedError = $filter('translate')(error.error);
                            areYouSureModalFactory(null, localizedError, {ok : true, cancel : false}, {event : error.withEvent});
                        }
                    });
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


        $scope.hideSearch = function(){
            console.log('hideSearch');
            $scope.searchController.active = false;
            $scope.filters.query = "";
        }
    }).directive('eventsListSearchBox', function($timeout){
        return function(scope, element, attrs){
            element.focus(function(){
                scope.$apply(function(){
                    scope.searchController.active = true;
                });
            });

            scope.$on('$destroy', function(){
                element.off('focus');
            });
        }
    }).service('EventsNotificationsHolder', function(Alert){
        this.alert = new Alert(3000);
    });