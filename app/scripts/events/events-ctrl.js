//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('EventsCtrl', function($scope, $log, DateHolder, Event, $filter, ShiftsDayHolder, Localizer, $filter, DateHelpers, AllDayShift, CloseOpenControls, BusinessHolder, EventsCollection, StatusFilters, areYouSureModalFactory, SeatsHolder, EventsNotificationsHolder, EventsHelpers){

        EventsHelpers.init();

        $scope.DateHolder = DateHolder;
        $scope.ShiftsDayHolder = ShiftsDayHolder;
        $scope.business = BusinessHolder.business;
        $scope.sortedEvents = EventsCollection.sorted;
        $scope.eventsNotifications = EventsNotificationsHolder.alert;
        $scope.showDeadEvents = false;
        $scope.StatusFilters = StatusFilters;
        $scope.searchController = { active : false};
        $scope.filters = {
            query : "",
            status :  StatusFilters[0]
        }

        /**
         * Create new event
         * @param occasionalOrDestination
         * @param seatsDic
         * @param startTime
         */
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


        /**
         * Close new event
         * @param success
         */
        $scope.closeNewEvent = function(success){
            if(success){
                EventsHelpers.userChooseClock($scope.newEvent.data.startTime);
            }
            $scope.newEvent = null;
        }


        /**
         * Listen to click on events (from shift-organizer)
         */
        $scope.$on('$clickOnEvent', function(data,event){
            $scope.clickOnEvent(event);
        });


        /**
         * Click on event in event list OR in shift-organizer
         * @param event
         */
        $scope.clickOnEvent = function(event){
            if($scope.switchMode){
                addEventToSwitchMode(event);
            }else {
                $scope.openEditedEvent(event);
            }
        }


        /**
         * Open event for editing
         * @param event
         */
        $scope.openEditedEvent = function (event){
            CloseOpenControls();
            $scope.newEvent = null;
            if($scope.editedEvent === event){
                return;
            }else if($scope.editedEvent){
                alert('Cannot edit reservation while another reservation is opened');
            }
            event.$enterEditingMode();
            EventsHelpers.userChooseClock(event.data.startTime);
            $scope.editedEvent = event;
        };


        /**
         * Close current edited event
         * @param success
         */
        $scope.closeEditedEvent = function(success){
            if(success){
                EventsHelpers.userChooseClock($scope.editedEvent.data.startTime);
            }
            $scope.editedEvent = null;
        }


        /**
         * Event status has been changed, update and save in DB
         * @param event
         */
        $scope.eventStatusChanged = function(event){
            EventsCollection.saveWithValidation(event, true).then(function(){
            }, function(error){
                if(error && error.error){
                    var localizedError = $filter('translate')(error.error);
                    areYouSureModalFactory(null, localizedError, {ok : true, cancel : false}, {event : error.withEvent});
                }
            });
        };


        /**
         * User selected a filter
         */
        $scope.selectStatusFilter = function(filter){
            $scope.filters.status = filter;
            EventsHelpers.userChooseFilters($scope.filters);
        };

        /**
         * The user types in the search box
         */
        $scope.searchQueryWasChanged = function(){
            EventsHelpers.userChooseFilters($scope.filters);
        }

        /**
         * User selected new shift
         * @param shift
         * @param e is the click DOM event
         */
        $scope.selectNewShift = function(shift, e){
            EventsHelpers.userChooseShift(shift)
        };


        /**
         * Select All Day Shift
         */
        $scope.selectAllDayShift = function(){
            EventsHelpers.userChooseShift(AllDayShift(ShiftsDayHolder.currentDay));
            $scope.selectStatusFilter('ENTIRE_SHIFT');
            EventsHelpers.userChooseFilters({status : 'ENTIRE_SHIFT'});
        };

        /**
         * Toogle entire shift on/off
         */
        $scope.toggleEntireShift = function(){
            if(EventsCollection.recentFilters && EventsCollection.recentFilters.status === 'ENTIRE_SHIFT'){
                $scope.selectStatusFilter('ALL');
            }else{
                $scope.selectStatusFilter('ENTIRE_SHIFT');
            }
        }

        /**
         * Exit entire shift mode
         */
        $scope.exitEntireShiftMode = function(){
            EventsHelpers.userChooseClock(DateHolder.currentClock);
            $scope.selectStatusFilter('ALL');
        }

        /**
         * Cancel ENTIRE_SHIFT selection (reset)
         */
        var cancelEntireShift = function(){
            $scope.selectStatusFilter('ALL');
        }


        /**
         * Go to now
         * @param e
         */
        $scope.goToNow = function(e){
            if(e) e.preventDefault();
            cancelEntireShift();
            EventsHelpers.userChooseClock(moment());
        };


        /**
         * Toggle switch events mode
         * @param e
         */
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


        /**
         * Add event to switch mode selection
         * @param event
         */
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
                        if(error && error.error){
                            var localizedError = $filter('translate')(error.error);
                            areYouSureModalFactory(null, localizedError, {ok : true, cancel : false}, {event : error.withEvent});
                        }
                    });
            } else{
                $scope.eventToSwitch = event;
            }
        }


        /**
         * Toggle dead events display
         * @param e
         */
        $scope.toggleDeadEvents = function(e){
            e.preventDefault();
            if($scope.showDeadEvents){
                $scope.showDeadEvents = false;
            }else{
                $scope.showDeadEvents = true;
            }
        };


        /**
         * Hide search box
         */
        $scope.hideSearch = function(){
            $scope.searchController.active = false;
            $scope.filters.query = "";
            $scope.searchQueryWasChanged();
        };


        $scope.dateChanged = function(){
           EventsHelpers.userChooseDate(DateHolder.currentDate);
        };

        $scope.clockChanged = function(){
            EventsHelpers.userChooseClock(DateHolder.currentClock);
        };

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