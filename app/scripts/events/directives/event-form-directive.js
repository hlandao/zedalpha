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


               var revertEventToOriginal = function(){
                  angular.extend($scope.eventObj.data,eventClone);
               }

               $scope.$isNew = function(){
                   return $scope.eventObj.$isNew();
               }

                $scope.save = function(){
                    EventsCollection.saveWithValidation($scope.eventObj).then(function(output){
                        if(output && output.warnings && output.warnings.length){
                            var promises = [];
                            for (var i = 0; i < output.warnings.length; ++i){
                                promises.push(areYouSureModalFactory(null, output.warnings[i].warning).result);
                            }

                            $q.all(promises).then(function(){
                                EventsCollection.saveWithValidation($scope.eventObj, true);
                                $scope.closeLinkFN();
                            }, function(){

                            });
                        }else{
                            $scope.closeLinkFN();
                        }
                    }).catch(function(error){
                        if(error && error.error){
                            var localizedError = $filter('translate')(error.error);
                            $log.info('[EventForm] error saving event',error.error);
                            alert(localizedError);
                        }
                    });
               };
//
//
//
//                var saveAfterValidation = function(eventToSave){
//                    if(angular.isFunction(eventWatcher)) eventWatcher();
//                    var cloned = angular.copy(eventToSave);
//                    if(eventToSave.$id){
//                        delete cloned.helpers;
//                        var $event = EventsHolder.$allEvents.$child(eventToSave.$id);
//                        $event.$set(cloned).then(function(){
//                            delete eventToSave.helpers;
//                        }, function(error){
//                            $log.error('[EventForm] Error saving existing event child to Firebase',error);
//                        });
//                    }else{
//                        delete cloned.helpers;
//                        EventsHolder.$allEvents.$add(cloned).then(function(){
//                            delete eventToSave.helpers;
//                        }, function(error){
//                            $log.error('[EventForm] Error adding new event child to Firebase',error);
//                        });
//
//                    }
//                }
//
//
//
//
                $scope.close = function(event){
                    if($scope.eventObj.$id) revertEventToOriginal();
                    $scope.closeLinkFN();
                };
//
//                var revertEventToOriginal = function(){
//                    angular.extend($scope.event, eventClone);
//                }
//
//                var eventWatching = _.throttle(function(newVal, oldVal){
//                    var maxDuration;
//                    if(justRevertedWhileEditing){
//                        justRevertedWhileEditing = false;
//                        return;
//                    }
//
//                    // check start time
//                    if(newVal && newVal.startTime != oldVal.startTime){
//                        var startTimeMoment = moment(newVal.startTime);
//                        var newDuration = moment(oldVal.endTime).diff(moment(oldVal.startTime),'minutes');
//
//                        maxDuration  = EventsLogic.maxDurationForEventInMinutes(newVal);
//                        if(maxDuration == -1 || maxDuration > 0){
//                            if(maxDuration != -1) newDuration =  Math.min(newDuration, maxDuration);
//                            var newEndTimeMoment = startTimeMoment.clone().add(newDuration, 'minutes');
//                            $scope.event.endTime = new Date(newEndTimeMoment.format(FullDateFormat));
//                            justRevertedWhileEditing = true;
//                        }
//                    }
//
//
//                    // check guests
//                    if(newVal && newVal.guests !== oldVal.guests){
//                        var newDuration = EventsLogic.eventDurationForGuestsNumber(newVal.guests);
//                        maxDuration  = EventsLogic.maxDurationForEventInMinutes(newVal);
//                        if(newDuration && maxDuration > -1 && newDuration > maxDuration){
//                            alert('Maximum duration for these seats is ' + maxDuration + ' minutes');
//                        }else if(newDuration){
//                            EventsLogic.updateEventDuration(newVal, newDuration);
//                        }
//                    }
//
//
//
//
//
//                    // validate
//                    if(newVal){
//                        var isInvalid = EventsLogic.isInvalidEventWhileEdit(newVal);
//                        if(isInvalid && isInvalid.error){
//                            $log.info('[EventForm]: error while edit event', isInvalid.error);
//                            var localizedError = $filter('translate')(isInvalid.error);
//
//                            newVal.startTime =  oldVal.startTime;
//                            newVal.endTime =  oldVal.endTime;
//                            newVal.seats =  oldVal.seats;
//                            alert(localizedError);
//                            justRevertedWhileEditing = true;
//                        }
//                    }
//                },10);


                $scope.remove = function(event){
                    var modal = areYouSureModalFactory(null, 'REMOVE_EVENT_WARNING');
                    modal.result.then(function () {
                        EventsCollection.remove($scope.eventObj).then(function(){
                            $scope.closeLinkFN();
                        }, function(){

                        });
                    });

                }


                $scope.$on('$destroy', function(){
                    $scope.eventObj && $scope.eventObj.$exitEditingMode && $scope.eventObj.$exitEditingMode();
                });


                init();


            },
            link : function(scope, element, attrs){
                element.find('input').eq(0).focus();

                scope.closeLinkFN =  function(){
                    attrs.onClose && scope.$parent.$eval(attrs.onClose);
                }
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
    }).directive('eventSeatsValidator', function(EventsCollection){
        return {
            priority : 0,
            require : ['ngModel'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0];

                var validate = function(viewValue){
                    return validateSeats(viewValue).then(function(){
                        return validateCollisions(viewValue);
                    });
                }


                var validateSeats = function(value){
                    value = value || ngModel.$modelValue;
                    return scope.eventObj.$validateSeats(value);
                }

                var validateCollisions  =  function(value){
                    return EventsCollection.validateCollision(scope.eventObj, {seats : value});
                }


                ngModel.$parsers.push(function(viewValue){
                    var seatsBefore = ngModel.$modelValue;
                    validateCollisions(viewValue).then(function(warning){
                        ngModel.$setValidity('seats', true);
                    },function(error){
                        scope.event.seats = seatsBefore || {};
                    });

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
    }).directive('eventStartTimeValidator', function(EventsCollection){
        return {
            priority : 0,
            require : ['ngModel'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0];

                var validate = function(value){
                    return validateStartTime(value).then(validateCollisions);
                };

                var validateStartTime  = function(viewValue){
                    value = viewValue || ngModel.$modelValue;
                    return scope.eventObj.$validateStartTime(value);
                }

                var validateCollisions  =  function(){
                    return EventsCollection.validateCollision(scope.eventObj);
                }


                ngModel.$parsers.push(function(viewValue){
                    var valueStartTimeBefore = ngModel.$modelValue;
                    var valueEndtimeBefore = scope.event.endTime;
                    var valueDurationBefore = scope.eventObj.$getDuration();
                    validate(viewValue).then(function(){
                        var maxDurationForEvent = EventsCollection.maxEventDurationForEvent(viewValue);
                        scope.eventObj.$setEndTimeByMaxDuartion(maxDurationForEvent, valueDurationBefore);
                    }).catch(function(){
                        ngModel.$setValidity('startTime', false);
                        ngModel.$setViewValue(valueStartTimeBefore);
                    });
                    return viewValue;
                });
            }
        }
    }).directive('eventEndTimeValidator', function(EventsCollection){
        return {
            priority : 0,
            require : ['ngModel'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0];

                var validate = function(value){
                    return validateEndTime(value).then(validateCollisions);
                };

                var validateEndTime  = function(viewValue){
                    value = viewValue || ngModel.$modelValue;
                    return scope.eventObj.$validateEndTime(value);
                }

                var validateCollisions  =  function(){
                    return EventsCollection.validateCollision(scope.eventObj);
                }


                ngModel.$parsers.push(function(viewValue){
                    var valueEndTimeBefore = ngModel.$modelValue;
                    validate(viewValue).then(function(){
                    }).catch(function(){
                            ngModel.$setValidity('startTime', false);
                            ngModel.$setViewValue(valueEndTimeBefore);
                    });
                    return viewValue;
                });


            }
        }
    });