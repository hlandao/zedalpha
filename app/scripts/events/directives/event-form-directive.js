var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives
    .directive('hlEventForm', function(EventsCollection,areYouSureModalFactory, $filter, FullDateFormat, $q, $log, ShiftsDayHolder, BusinessHolder) {
        return {
            restrict: 'A',
            replace : true,
            priority : 10,
            scope : {
              onClose  : "&onClose",
              eventObj : "=event"
            },
            templateUrl : '/partials/events/event-form-directive.html',
            controller : function($scope){
               var eventClone;
                $scope.business = BusinessHolder.business;
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
                    },
                    isSaving = false;


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


                var showSaveSuccess = function(){
                    toastr.options = {
                        "closeButton": true,
                        "positionClass": "toast-bottom-right",
                        "timeOut": "3000"
                    };
                    var localizedMessage = $filter('translate')('SUCCESS_SAVE_EVENT');

                    toastr.success(localizedMessage);
                }


                $scope.save = function(){
                    if(isSaving){
                        return;
                    }


                    EventsCollection.saveWithValidation($scope.eventObj, false, $scope.seatingOptions).then(function(output){
                        if((output && output.warnings && output.warnings.length)){
                            var promises = [], i;

                            if(output && output.warnings && output.warnings.length){
                                for (i = 0; i < output.warnings.length; ++i){
                                    promises.push(areYouSureModalFactory(null, output.warnings[i].warning, null, output.warnings[i].extra).result);
                                }
                            }

                            return $q.all(promises).then(function(){
                                return EventsCollection.saveWithValidation($scope.eventObj, true).then(function(){
                                    showSaveSuccess();
                                    $scope.closeLinkFN(true);
                                }, function(error){
                                    return $q.reject('ERROR_EVENT_SAVING');
                                });


                            }, function(){
                                isSaving = false;
                            });
                        }else{
                            showSaveSuccess();
                            $scope.closeLinkFN(true);
                        }


                    }).catch(function(error){
                        isSaving = false;
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

                scope.closeLinkFN =  function(result){
                    scope.onClose({$result : result})
//                    attrs.onClose && scope.$parent.$eval(attrs.onClose);
                }
            }
        };
    })
    .directive('eventSeatingOptionsValidator', function(SeatsHolder, BusinessHolder){
        return function(scope, element, attrs){

            var updateSeatingOptions = function(newVal){
                var seatingOptionsForSeats = SeatsHolder.seatingOptionsForSeats(newVal);
                var seatingOptions = {};
                for(var i in seatingOptionsForSeats){
                    if(seatingOptionsForSeats[i] && BusinessHolder.business.seatingOptions[i]) seatingOptions[i] = BusinessHolder.business.seatingOptions[i];
                }
                scope.seatingOptions = seatingOptions;
            };

            scope.$watch('event.seats', updateSeatingOptions);
        }
    })
    .directive('eventPhoneValidator', function(CustomersHolder){
        return {
            priority : 0,
            require : ['ngModel'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0];

                ngModel.$validators.invalidPhone = function(modelValue, viewValue){
                    var value = modelValue || viewValue;
                    var resultError = scope.eventObj.$validatePhone(value);
                    if(resultError && resultError.error){
                        return false;
                    }else{
                        return true;
                    }
                }

            }
        }
    }).directive('eventPhoneTypeahead', function(CustomersHolder){
        return {
            scope : {
                event : "=eventPhoneTypeahead"
            },
            replace : true,
            template : '<div ng-class="{open : isOpened}" style="width:100%;position:relative;">' +
                '<ul class="dropdown-menu" ng-show="isOpened">' +
                            '<li class="" ng-repeat="item in suggestions">' +
                                '<a href="#" ng-click="select(item,$event)">{{item.$getPhoneNumber()}} - {{item.name}}</a>' +
                            '</li>' +
                         '</ul></div>',
            link : function(scope, element, attrs){
               var updatedByMe, initalized;
               scope.isOpened = false;
               scope.select = function(item, e){
                   scope.isOpened = false;
                   updatedByMe = true;
                   e.preventDefault();
                   e.stopPropagation();
                   scope.event.phone = item.$getPhoneNumber();
                   if(item.name) scope.event.name = item.name;
                   if(item.contactComment) scope.event.contactComment=  item.contactComment;
               }

               scope.$watch('event.phone', function(newVal){

                   if(!initalized){
                       return initalized = true;
                   }

                    if(updatedByMe){
                        return updatedByMe = false;
                    }
                   if(!newVal) return;
                   scope.suggestions =  CustomersHolder.collection.$getSuggestions(newVal);
                   if(scope.suggestions && scope.suggestions.length){
                       scope.isOpened = true;
                   }else{
                       scope.isOpened = false;
                   }

               });
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
    }).directive('eventGuestsValidator', function(EventsCollection, BusinessHolder){
        return {
            priority : 0,
            require : ['ngModel'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0];

                ngModel.$asyncValidators.gusetsPer15 = function(modelValue, viewValue){
                    value = modelValue || viewValue;
                    return EventsCollection.checkGuestsPer15Minutes(scope.eventObj, value).then(function(){
                        updateEventDurationWithValue(value);
                    });
                }

                var updateEventDurationWithValue = function(value){
                    if(!value) return;
                    var eventsDurationForGuests = BusinessHolder.business.eventsDurationForGuests;
                    if(!eventsDurationForGuests) return;
                    var suggestedDuration = eventsDurationForGuests[value];
                    if(suggestedDuration){
                        EventsCollection.maxDurationForStartTime(null, null, scope.eventObj).then(function(maxDurationForEvent){
                            scope.eventObj.$setEndTimeByMaxDuartion(maxDurationForEvent, suggestedDuration);
                        });
                    }
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

                ngModel.$asyncValidators.validateCollision = function(modelValue, viewValue){
                    var value = modelValue || viewValue;
                    var beforeValue = scope.eventObj.data.seats;
                    return EventsCollection.validateCollision(scope.eventObj, {seats : value}).then(function(){
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
    }).directive('eventFormBaseDatePicker', function(DateFormatFirebase, EventsCollection, areYouSureModalFactory, $filter,DateHolder){
        return {
            replace : false,
            require : ['ngModel'],
            restrict : 'E',
            template : '<input type="text" class="datepicker-input" pick-a-date="date" on-change="dateChanged()"/>',
            link : function(scope, element, attrs, ctrls){
                var ngModel = ctrls[0];

                ngModel.$render = function(){
                    scope.date = moment(ngModel.$modelValue, DateFormatFirebase);
                }

                ngModel.$parsers.push(function(viewValue){
                    return viewValue.format(DateFormatFirebase);
                });

                scope.dateChanged = function(){
                    EventsCollection.changeBaseDateForEvent(scope.eventObj, scope.date).then(function(){
                        DateHolder.goToEvent(scope.eventObj);
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
    }).directive('eventStartTimeValidator', function(EventsCollection, areYouSureModalFactory, $filter, $q, $timeout, DateHolder){
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

                            return EventsCollection.maxDurationForStartTime(value, scope.eventObj.data.seats, scope.eventObj).then(function(maxDurationForEvent){
                                if(maxDurationForEvent > 0 && maxDurationForEvent < valueDurationBefore) {
                                    var localizedError = $filter('translate')('START_TIME_CHANGE_WILL_CHANGE_EVENT_DURATION', {duration: maxDurationForEvent});
                                    return areYouSureModalFactory(null, localizedError, null).result.then(function () {
                                        scope.eventObj.$setEndTimeByMaxDuartion(maxDurationForEvent, valueDurationBefore, value);
                                        DateHolder.goToEvent(scope.eventObj);
                                        return true;
                                    }, function () {
                                        console.log('user refuses to change end time');
                                        rejectedPreviousValue = valueBeforeClone;
                                        return $q.reject('user refuses to change end time');
                                    });
                                }else if(maxDurationForEvent == -1 || maxDurationForEvent == valueDurationBefore){
                                    scope.eventObj.$setEndTimeByMaxDuartion(maxDurationForEvent, valueDurationBefore, value);
                                    DateHolder.goToEvent(scope.eventObj);
                                    return true;
                                }else{
                                    DateHolder.goToEvent(scope.eventObj);
                                    return true;
                                }
                            });

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
                            console.log('starttime rejectedPreviousValue');
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