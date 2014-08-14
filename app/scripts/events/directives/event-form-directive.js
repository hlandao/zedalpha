var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives
    .directive('hlEventForm', function(EventsLogic,areYouSureModalFactory, $filter, EventsHolder,EventsDurationForGuestsHolder, FullDateFormat, $q, $log, ShiftsDayHolder) {
        return {
            restrict: 'A',
            replace : true,
            priority : 10,
            scope : {
              event : "="
            },
            templateUrl : '/partials/events/event-form-directive.html',
            controller : function($scope){
               var justRevertedWhileEditing,
                   eventWatcher,
                   eventGuestsWatcher;

                var init = function(){
                    justRevertedWhileEditing = false;
                    eventWatcher = $scope.$watch('event', eventWatching,true);
                    eventGuestsWatcher = $scope.$watch('event.guests', function(newVal){
                        if(newVal){
                            var newDuration = EventsDurationForGuestsHolder[newVal];
                            updateEventTimeWithNewDuration(newDuration);
                        }

                    })
                    $scope.event.helpers = $scope.event.helpers || {};
                }



               $scope.isNew = function(){
                   return !$scope.event.$id;
               }

                $scope.save = function(eventToSave){
                    var isInvalidPromise = EventsLogic.isInvalidEventBeforeSave(eventToSave);
                    isInvalidPromise.then(function(output){
                        if(output && output.warnings && output.warnings.length){
                            var promises = [];
                            for (var i = 0; i < output.warnings.length; ++i){
                                promises.push(areYouSureModalFactory(null, output.warnings[i].warning));
                            }
                            $q.all(promises).then(function(){
                                saveAfterValidation(eventToSave);
                            }, function(){

                            });
                        }else{
                            saveAfterValidation(eventToSave);
                        }
                    },function(output){
                        if(output && output.error){
                            var localizedError = $filter('translate')(output.error);
                            $log.info('[EventFormDirective] error saving event',output.error);
                            alert(localizedError);
                        }
                    });
                };



                var saveAfterValidation = function(eventToSave){
                    if(angular.isFunction(eventWatcher)) eventWatcher();
                    var cloned = angular.copy(eventToSave);
                    if(eventToSave.$id){
                        delete cloned.helpers;
                        var $event = EventsHolder.$allEvents.$child(eventToSave.$id);
                        $event.$set(cloned).then(function(){
                            delete eventToSave.helpers;
                        }, function(error){
                            $log.error('[EventForm] Error saving existing event child to Firebase',error);
                        });
                    }else{
                        delete cloned.helpers;
                        EventsHolder.$allEvents.$add(cloned).then(function(){
                            delete eventToSave.helpers;
                        }, function(error){
                            $log.error('[EventForm] Error adding new event child to Firebase',error);
                        });

                    }
                }




                $scope.close = function(event){
                    if(!event) return false;
                    delete event.helpers;
                };


                var eventWatching = function(newVal, oldVal){
                    if(justRevertedWhileEditing){
                        justRevertedWhileEditing = false;
                        return;
                    }
                    if(newVal){
                        var isInvalid = EventsLogic.isInvalidEventWhileEdit(newVal);
                        if(isInvalid && isInvalid.error){
                            $log.info('[EventForm]: error while edit event', isInvalid.error);
                            var localizedError = $filter('translate')(isInvalid.error);
                            alert(localizedError);
                            justRevertedWhileEditing = true;
                            newVal.startTime =  oldVal.startTime;
                            newVal.endTime =  oldVal.endTime;
                            newVal.seats =  oldVal.seats;
                        }else{
                            if(newVal.guests !== oldVal.guests){
                                var newDuration = EventsLogic.eventDurationForGuestsNumber(newVal.guests);
                                if(newDuration) EventsLogic.updateEventDuration(newVal, newDuration);
                            }
                        }
                    }
                };

                $scope.remove = function(event){
                    if(!event || !event.$id) return false;
                    var modal = areYouSureModalFactory(null, 'REMOVE_EVENT_WARNING');
                    modal.result.then(function () {
                        EventsHolder.$allEvents.$remove(event.$id);
                        delete event.helpers;
                    }, function () {
                    });

                }


                var updateEventTimeWithNewDuration = function(newDuration){
                    if (newDuration && $scope.event.startTime){
                        var startTimeMoment = moment($scope.event.startTime);
                        var newEndTimeMoment = startTimeMoment.add(parseInt(newDuration), 'minutes');
                        $scope.event.endTime = new Date(newEndTimeMoment.format(FullDateFormat));

                    }
                }


                var shiftsWatcher = $scope.$watch(function(){
                    return ShiftsDayHolder.selected;
                }, function(newVal){
                    if(newVal){
                        $scope.minStartTime = newVal.startTime;
                        $scope.maxStartTime = newVal.endTime;
                    }
                });

                $scope.$on('$destroy', function(){
                    eventWatcher();
                    eventGuestsWatcher();
                    shiftsWatcher();
                });


                init();


            },
            link : function(scope, element, attrs){
                element.find('input').eq(0).focus();
            }
        };
    });