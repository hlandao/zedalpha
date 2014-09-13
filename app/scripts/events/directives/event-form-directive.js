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
                var requiredInputsForDest = {
                        name : true,
                        phone : true,
                        hostess : true,
                        seats : true
                    },
                    requiredInputsForOccasional = {
                        name : true,
                        phone : false,
                        hostess : false,
                        seats : true
                    };


                var init = function(){

                    $scope.event = $scope.eventObj.data;
                    eventClone = angular.copy($scope.event);
                    if($scope.event.isOccasional){
                        $scope.requiredInputs = requiredInputsForOccasional;
                    }else{
                        $scope.requiredInputs = requiredInputsForDest;
                    }
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
                                $scope.closeLinkFN(true);
                            }, function(){

                            });
                        }else{
                            $scope.closeLinkFN(true);
                        }
                    }).catch(function(error){

                        if(error && error.error){
                            var localizedError = $filter('translate')(error.error);
                            $log.info('[EventForm] error saving event',error);
                            areYouSureModalFactory(null, localizedError, {ok : true, cancel : false}, {event : error.withEvent});
                        }
                    });
               };

                $scope.close = function(event){
                    if($scope.eventObj.$id) revertEventToOriginal();
                    $scope.closeLinkFN();
                };

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
    })
    .directive('eventPhoneValidator', function(){
        return {
            priority : 0,
            require : ['ngModel'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0];

                ngModel.$validators.invalidPhone = function(modelValue, viewValue){
                    console.log('modelValue, viewValue',modelValue, viewValue);
                    var value = modelValue || viewValue;
                    var resultError = scope.eventObj.$validatePhone(value);
                    console.log('resultError',resultError);
                    if(resultError && resultError.error){
                        return false;
                    }else{
                        return true;
                    }
                }
            }
        }
    }).directive('eventNameValidator', function(){
        return {
            priority : 0,
            require : ['ngModel'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0];

                ngModel.$validators.invalidName = function(modelValue, viewValue){
                    var value = modelValue || viewValue;
                    var resultError = scope.eventObj.$validateName(value);
                    if(resultError && resultError.error){
                        return false;
                    }else{
                        return true;
                    }
                }
            }
        }
    }).directive('eventGuestsValidator', function(EventsCollection){
        return {
            priority : 0,
            require : ['ngModel'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0];

                ngModel.$asyncValidators.gusetsPer15 = function(modelValue, viewValue){
                    value = modelValue || viewValue;
                    return EventsCollection.checkGuestsPer15Minutes(scope.eventObj, value);
                }
            }
        }
    }).directive('eventSeatsValidator', function(EventsCollection, $q, $timeout, areYouSureModalFactory, $filter){
        return {
            priority : 0,
            require : ['ngModel'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0];

                ngModel.$validators.invalidSeats = function(modelValue, viewValue){
                    var value = modelValue || viewValue;
                    var resultError = scope.eventObj.$validateSeats(value);
                    if(resultError && resultError.error){
                        return false;
                    }else{
                        return true;
                    }
                }


                var rejectedPreviousValue = null;

                ngModel.$asyncValidators.seatsCollision = function(modelValue, viewValue){
                    var value = modelValue || viewValue;
                    var beforeValue = scope.eventObj.data.seats;
                    return EventsCollection.validateCollision(scope.eventObj, {seats : value}).then(function(){
                        console.log('seats ok',value);
                        return true;
                    }, function(error){
                        if(error && error.error){
                            var localizedError = $filter('translate')(error.error);
                            areYouSureModalFactory(null, localizedError, {ok : true, cancel : false}, {event : error.withEvent});
                        }
                        rejectedPreviousValue = beforeValue;
                        return $q.reject('Collision with another event');
                    });
                }

                ngModel.$viewChangeListeners.push(function(){
                    if(rejectedPreviousValue){
                        $timeout(function(){
                            scope.eventObj.data.seats = rejectedPreviousValue;
                            rejectedPreviousValue = null;
                        });
                    }
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
    }).directive('eventHostessValidator', function(){
        return {
            priority : 0,
            require : ['ngModel'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0];


                ngModel.$validators.invalidHostess = function(modelValue, viewValue){
                    var value = modelValue || viewValue;
                    var resultError = scope.eventObj.$validateHostess(value);
                    if(resultError && resultError.error){
                        return false;
                    }else{
                        return true;
                    }
                }

            }
        }
    }).directive('eventFormBaseDatePicker', function(DateFormatFirebase, EventsCollection, areYouSureModalFactory, $filter){
        return {
            replace : false,
            require : ['ngModel'],
            restrict : 'E',
            template : '<input type="text" class="datepicker-input" pick-a-date="date" on-change="dateChanged()"/>',
            link : function(scope, element, attrs, ctrls){
                var ngModel = ctrls[0];

                ngModel.$render = function(){
                    console.log('base date',ngModel.$modelValue, DateFormatFirebase);
                    scope.date = moment(ngModel.$modelValue, DateFormatFirebase);
                }

                ngModel.$parsers.push(function(viewValue){
                    return viewValue.format(DateFormatFirebase);
                });

                scope.dateChanged = function(){
                    EventsCollection.changeBaseDateForEvent(scope.eventObj, scope.date).then(function(){

                    }).catch(function(error){
                        if(error && error.error){
                            var localizedError = $filter('translate')(error.error);
                            areYouSureModalFactory(null, localizedError, {ok : true, cancel : false}, {event : error.withEvent});
                        }
                    });
//                    var oldVal = ngModel.$modelValue;
//                    ngModel.$setViewValue(scope.date);
//                    scope.eventObj.$baseDateWasChangedByUser(oldVal);
                }
            }
        }
    }).directive('eventStartTimeValidator', function(EventsCollection, areYouSureModalFactory, $filter, $q, $timeout){
        return {
            require : ['ngModel'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0];

                ngModel.$validators.invalidStartTime = function(modelValue, viewValue){
                    var value = modelValue || viewValue;
                    var resultError = scope.eventObj.$validateStartTime(value);
                    if(resultError && resultError.error){
                        return false;
                    }else{
                        return true;
                    }
                }


                var rejectedPreviousValue = null;

                ngModel.$asyncValidators.validateCollisions = function(modelValue, viewValue) {
                    var value = modelValue || viewValue;
                    if(!value){
                        var defer = $q.defer();
                        defer.resolve(true);
                        return defer.promise;
                    }

                    var valueBeforeClone = scope.eventObj.data.startTime ? scope.eventObj.data.startTime.clone() : null;

                    return EventsCollection.validateCollision(scope.eventObj, {startTime : value}).then(function(){
                        rejectedPreviousValue = null;
                        var valueDurationBefore = scope.eventObj.$getDuration();
                            EventsCollection.maxDurationForStartTime(value, scope.eventObj.data.seats, scope.eventObj).then(function(maxDurationForEvent){
                                scope.eventObj.$setEndTimeByMaxDuartion(maxDurationForEvent, valueDurationBefore, value);
                            });

                        return true;
                    }, function(error){
                        if(error && error.error){
                            var localizedError = $filter('translate')(error.error);
                            areYouSureModalFactory(null, localizedError, {ok : true, cancel : false}, {event : error.withEvent});
                        }
                        rejectedPreviousValue = valueBeforeClone;
                        return $q.reject('startTime overlapping');
                    });
                };

                ngModel.$viewChangeListeners.push(function(){
                    if(rejectedPreviousValue){
                        $timeout(function(){
                            scope.eventObj.data.startTime = rejectedPreviousValue;
                            rejectedPreviousValue = null;
                        });
                    }
                });
            }
        }
    }).directive('eventEndTimeValidator', function(EventsCollection, areYouSureModalFactory, $filter, $q, $timeout ){
        return {
            priority : 0,
            require : ['ngModel'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0];


                ngModel.$validators.invalidEndTime = function(modelValue, viewValue){
                    var value = modelValue || viewValue;
                    var resultError = scope.eventObj.$validateEndTime(value);
                    if(resultError && resultError.error){
                        return false;
                    }else{
                        return true;
                    }
                }


                var rejectedPreviousValue = null;

                ngModel.$asyncValidators.validateCollisions = function(modelValue, viewValue) {
                    var value = modelValue || viewValue;
                    if(!value){
                        var defer = $q.defer();
                        defer.resolve(true);
                        return defer.promise;
                    }

                    var valueBeforeClone = scope.eventObj.data.endTime ? scope.eventObj.data.endTime.clone() : null;

                    return EventsCollection.validateCollision(scope.eventObj, {endTime : value}).then(function(){
                        rejectedPreviousValue = null;
                        return true;
                    }, function(error){
                        if(error && error.error){
                            var localizedError = $filter('translate')(error.error);
                            areYouSureModalFactory(null, localizedError, {ok : true, cancel : false}, {event : error.withEvent});
                        }
                        rejectedPreviousValue = valueBeforeClone;
                        return $q.reject('startTime overlapping');
                    });
                };

                ngModel.$viewChangeListeners.push(function(){
                    if(rejectedPreviousValue){
                        $timeout(function(){
                            scope.eventObj.data.endTime = rejectedPreviousValue;
                            rejectedPreviousValue = null;
                        });
                    }
                });


            }
        }
    });