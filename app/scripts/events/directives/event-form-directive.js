var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives
    .directive('hlEventForm', function(EventsCollection,areYouSureModalFactory, $filter, FullDateFormat, $q, $log, ShiftsDayHolder) {
        return {
            restrict: 'A',
            replace : true,
            priority : 10,
            scope : {
              eventObj : "=event"
            },
            templateUrl : '/partials/events/event-form-directive.html',
            controller : function($scope){
               var eventClone;

                var init = function(){
                    $scope.event = $scope.eventObj.data;
                    eventClone = angular.copy($scope.event);
                }



               $scope.$isNew = function(){
                   return $scope.event.$isNew();
               }

                $scope.save = function(eventToSave){
                    var isInvalidPromise = EventsLogic.isInvalidEventBeforeSave(eventToSave);
                    isInvalidPromise.then(function(output){
                        if(output && output.warnings && output.warnings.length){
                            var promises = [];
                            for (var i = 0; i < output.warnings.length; ++i){
                                promises.push(areYouSureModalFactory(null, output.warnings[i].warning).result);
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
                            $log.info('[EventForm] error saving event',output.error);
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
                    if(event.$id) revertEventToOriginal();
                    if(!event) return false;
                    delete event.helpers;
                };

                var revertEventToOriginal = function(){
                    angular.extend($scope.event, eventClone);
                }

                var eventWatching = _.throttle(function(newVal, oldVal){
                    var maxDuration;
                    if(justRevertedWhileEditing){
                        justRevertedWhileEditing = false;
                        return;
                    }

                    // check start time
                    if(newVal && newVal.startTime != oldVal.startTime){
                        var startTimeMoment = moment(newVal.startTime);
                        var newDuration = moment(oldVal.endTime).diff(moment(oldVal.startTime),'minutes');

                        maxDuration  = EventsLogic.maxDurationForEventInMinutes(newVal);
                        if(maxDuration == -1 || maxDuration > 0){
                            if(maxDuration != -1) newDuration =  Math.min(newDuration, maxDuration);
                            var newEndTimeMoment = startTimeMoment.clone().add(newDuration, 'minutes');
                            $scope.event.endTime = new Date(newEndTimeMoment.format(FullDateFormat));
                            justRevertedWhileEditing = true;
                        }
                    }


                    // check guests
                    if(newVal && newVal.guests !== oldVal.guests){
                        var newDuration = EventsLogic.eventDurationForGuestsNumber(newVal.guests);
                        maxDuration  = EventsLogic.maxDurationForEventInMinutes(newVal);
                        if(newDuration && maxDuration > -1 && newDuration > maxDuration){
                            alert('Maximum duration for these seats is ' + maxDuration + ' minutes');
                        }else if(newDuration){
                            EventsLogic.updateEventDuration(newVal, newDuration);
                        }
                    }





                    // validate
                    if(newVal){
                        var isInvalid = EventsLogic.isInvalidEventWhileEdit(newVal);
                        if(isInvalid && isInvalid.error){
                            $log.info('[EventForm]: error while edit event', isInvalid.error);
                            var localizedError = $filter('translate')(isInvalid.error);

                            newVal.startTime =  oldVal.startTime;
                            newVal.endTime =  oldVal.endTime;
                            newVal.seats =  oldVal.seats;
                            alert(localizedError);
                            justRevertedWhileEditing = true;
                        }
                    }
                },10);


                $scope.remove = function(event){
                    if(!event || !event.$id) return false;
                    var modal = areYouSureModalFactory(null, 'REMOVE_EVENT_WARNING');
                    modal.result.then(function () {
                        EventsHolder.$allEvents.$remove(event.$id);
                        delete event.helpers;
                    }, function () {
                    });

                }


                $scope.$on('$destroy', function(){
                    eventClone = null;
                });


                init();


            },
            link : function(scope, element, attrs){
                element.find('input').eq(0).focus();
            }
        };
    }).directive('eventPhoneValidator', function(){
        return {
            priority : 0,
            require : ['ngModel'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0];

                var validate = function(value){
                    value = value || ngModel.$modelValue;
                    scope.eventObj.$validatePhone(value).then(function(warning){
                        ngModel.$setValidity('phone', true);
                    },function(error){
                        ngModel.$setValidity('phone', false);
                    });
                }

                validate();

                ngModel.$parsers.push(function(viewValue){
                    validate(viewValue);
                    return viewValue;
                });
            }
        }
    }).directive('eventNameValidator', function(){
        return {
            priority : 0,
            require : ['ngModel'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0];

                var validate = function(value){
                    value = value || ngModel.$modelValue;
                    scope.eventObj.$validateName(value).then(function(warning){
                        ngModel.$setValidity('name', true);
                    },function(error){
                        ngModel.$setValidity('name', false);
                    });
                }

                validate();

                ngModel.$parsers.push(function(viewValue){
                    validate(viewValue);
                    return viewValue;
                });


            }
        }
    }).directive('eventGuestsValidator', function(EventsCollection){
        return {
            priority : 0,
            require : ['ngModel'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0];

                var validate = function(value){
                    value = value || ngModel.$modelValue;
                    EventsCollection.checkGuestsPer15Minutes(scope.event.startTime, value).then(function(warning){
                        ngModel.$setValidity('guests', true);
                    },function(error){
                        ngModel.$setValidity('guests', false);
                    });
                }

                validate();

                ngModel.$parsers.push(function(viewValue){
                    validate(viewValue);
                    return viewValue;
                });

            }
        }
    }).directive('eventSeatsValidator', function(){
        return {
            priority : 0,
            require : ['ngModel'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0];

                var validate = function(value){
                    value = value || ngModel.$modelValue;
                    scope.eventObj.$validateSeats(value).then(function(warning){
                        ngModel.$setValidity('seats', true);
                    },function(error){
                        ngModel.$setValidity('seats', false);
                    });
                }

                validate();

                ngModel.$parsers.push(function(viewValue){
                    validate(viewValue);
                    return viewValue;
                });
            }
        }
    }).directive('eventEmailValidator', function(){
        return {
            priority : 0,
            require : ['ngModel'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0];
            }
        }
    }).directive('eventStatusValidator', function(){
        return {
            priority : 0,
            require : ['ngModel'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0];
            }
        }
    }).directive('eventStartTimeValidator', function(){
        return {
            priority : 0,
            require : ['ngModel'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0];

                var validate = function(value){
                    console.log('eventStartTimeValidator viewValue',value);
                };

                var validateStartTime = function(value){
                    value = value || ngModel.$modelValue;
                    scope.eventObj.$validateStartTime(value).then(function(warning){
                        ngModel.$setValidity('startTime', true);
                    },function(error){
                        ngModel.$setValidity('startTime', false);
                    });
                }

                var validateCollisions = function(){

                }


//                ngModel.$parsers.push(function(viewValue){
////                    validate(viewValue);
//                    return viewValue;
//                });


            }
        }
    }).directive('eventEndTimeValidator', function(){
        return {
            priority : 0,
            require : ['ngModel'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0];
            }
        }
    });