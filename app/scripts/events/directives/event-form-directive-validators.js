var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives
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

        scope.$watch('event.data.seats', updateSeatingOptions);
    }
})
    .directive('eventPhoneValidator', function(CustomersHolder){
        return {
            priority : 0,
            require : ['ngModel','^hlEventForm'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0],
                    hlEventFormCtrl = ctrls[1];

                ngModel.$validators.invalidPhone = function(modelValue, viewValue){
                    var value = modelValue || viewValue;
                    var resultError = hlEventFormCtrl.event.$validatePhone(value);
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
            },
            require : ['^hlEventForm'],
            replace : true,
            template : '<div ng-class="{open : isOpened}" style="width:100%;position:relative;">' +
                '<ul class="dropdown-menu" ng-show="isOpened">' +
                '<li class="" ng-repeat="item in suggestions">' +
                '<a href="#" ng-click="select(item,$event)">{{item.$getPhoneNumber()}} - {{item.name}}</a>' +
                '</li>' +
                '</ul></div>',
            link : function(scope, element, attrs, ctrls){
                var hlEventFormCtrl = ctrls[0], updatedByMe, initalized;
                scope.isOpened = false;
                scope.select = function(item, e){
                    scope.isOpened = false;
                    updatedByMe = true;
                    e.preventDefault();
                    e.stopPropagation();
                    hlEventFormCtrl.event.data.phone = item.$getPhoneNumber();
                    if(item.name) hlEventFormCtrl.event.data.name = item.name;
                    if(item.contactComment) hlEventFormCtrl.event.data.contactComment=  item.contactComment;
                }

                scope.$watch(function(){
                    return hlEventFormCtrl.event.data.phone;
                }, function(newVal){

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
            require : ['ngModel', '^hlEventForm'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0],
                    hlEventFormCtrl = ctrls[1];

                ngModel.$validators.invalidName = function(modelValue, viewValue){
                    var value = modelValue || viewValue;
                    var resultError = hlEventFormCtrl.event.$validateName(value);
                    if(resultError && resultError.error){
                        return false;
                    }else{
                        return true;
                    }
                }
            }
        }
    }).directive('eventGuestsValidator', function(EventsCollection, BusinessHolder, $q){
        return {
            priority : 0,
            require : ['ngModel','^hlEventForm'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0],
                    hlEventFormCtrl = ctrls[1];

                ngModel.$asyncValidators.gusetsPer15 = function(modelValue, viewValue){
                    value = modelValue || viewValue;
                    if(!ngModel.$dirty){
                        var defer = $q.defer();
                        defer.resolve();
                        return defer.promise;
                    }
                    return EventsCollection.checkGuestsPer15Minutes(hlEventFormCtrl.event, value).then(function(){
                        updateEventDurationWithValue(value);
                    });
                }

                var updateEventDurationWithValue = function(value){
                    if(!value) return;
                    var eventsDurationForGuests = BusinessHolder.business.eventsDurationForGuests;
                    if(!eventsDurationForGuests) return;
                    var suggestedDuration = eventsDurationForGuests[value];
                    if(suggestedDuration){
                        EventsCollection.maxDurationForStartTime(null, null, hlEventFormCtrl.event).then(function(maxDurationForEvent){
                            hlEventFormCtrl.event.$setEndTimeByMaxDuartion(maxDurationForEvent, suggestedDuration);
                        });
                    }
                }
            }
        }
    }).directive('eventSeatsValidator', function(EventsCollection, $q, $timeout, areYouSureModalFactory, $filter){
        return {
            priority : 0,
            require : ['ngModel','^hlEventForm'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0],
                    hlEventFormCtrl = ctrls[1];

                ngModel.$validators.invalidSeats = function(modelValue, viewValue){
                    var value = modelValue || viewValue;
                    var resultError = hlEventFormCtrl.event.$validateSeats(value);
                    if(resultError && resultError.error){
                        return false;
                    }else{
                        return true;
                    }
                }



                ngModel.$asyncValidators.validateCollision = function(modelValue, viewValue){
                    var value = modelValue || viewValue;

                    if(!ngModel.$dirty){
                        var defer = $q.defer();
                        defer.resolve();
                        return defer.promise;
                    }

                    return EventsCollection.validateCollision(hlEventFormCtrl.event, {seats : value}).then(function(){
                        return true;
                    }, function(error){
                        if(error && error.error && ngModel.$dirty){
                            var localizedError = $filter('translate')(error.error);
                            areYouSureModalFactory(null, localizedError, {ok : true, cancel : false}, {event : error.withEvent});
                        }
                        return $q.reject('Collision with another event');
                    });
                }


                ngModel.$validationCompleted = function(allValid, prevValue){
                    if(!allValid){
                        hlEventFormCtrl.event.data.seats = prevValue;
                    }
                };


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
            require : ['ngModel', '^hlEventForm'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0],
                    hlEventFormCtrl = ctrls[1];


                ngModel.$validators.invalidHostess = function(modelValue, viewValue){
                    var value = modelValue || viewValue;
                    var resultError = hlEventFormCtrl.event.$validateHostess(value);
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
            require : ['ngModel','^hlEventForm'],
            restrict : 'E',
            template : '<input type="text" class="datepicker-input" pick-a-date="date" on-change="dateChanged()"/>',
            link : function(scope, element, attrs, ctrls){


                var ngModel = ctrls[0],
                    hlEventFormCtrl = ctrls[1];

                ngModel.$render = function(){
                    scope.date = moment(ngModel.$modelValue, DateFormatFirebase);
                }

                ngModel.$parsers.push(function(viewValue){
                    return viewValue.format(DateFormatFirebase);
                });

                scope.dateChanged = function(){
                    EventsCollection.changeBaseDateForEvent(hlEventFormCtrl.event, scope.date).then(function(){
                        DateHolder.goToEvent(hlEventFormCtrl.event);
                    }).catch(function(error){
                        if(error && error.error){
                            console.error('[eventFormBaseDatePicker] Error : ',error);
                            var localizedError = $filter('translate')(error.error);
                            areYouSureModalFactory(null, localizedError, {ok : true, cancel : false}, {event : error.withEvent});
                        }
                    });
                }

            }
        }
    }).directive('eventStartTimeValidator', function(EventsCollection, areYouSureModalFactory, $filter, $q, $timeout, DateHolder,$log, ShiftsDayHolder){
        return {
            require : ['ngModel','^hlEventForm'],
            priority : 0,
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0],
                    hlEventFormCtrl = ctrls[1];

                ngModel.$validators.invalidStartTime = function(modelValue, viewValue){
                    var value = modelValue || viewValue;
                    var resultError = hlEventFormCtrl.event.$validateStartTime(value);
                    if(resultError && resultError.error){
                        return false;
                    }else{
                        return true;
                    }
                }



                ngModel.$asyncValidators.validateCollisions = function(modelValue, viewValue) {

                    var value = modelValue || viewValue;
                    if(!value || !ngModel.$dirty){
                        var defer = $q.defer();
                        defer.resolve(true);
                        return defer.promise;
                    }

                    return EventsCollection.validateCollision(hlEventFormCtrl.event, {startTime : value}).then(function(){
                        var durationValueBefore = hlEventFormCtrl.event.$getDuration();

                        return EventsCollection.maxDurationForStartTime(value, hlEventFormCtrl.event.data.seats, hlEventFormCtrl.event).then(function(maxDurationForEvent){
                            if(maxDurationForEvent > 0 && maxDurationForEvent < durationValueBefore) {
                                $log.info('[eventStartTimeValidator] Warning : START_TIME_CHANGE_WILL_CHANGE_EVENT_DURATION');
                                var localizedError = $filter('translate')('START_TIME_CHANGE_WILL_CHANGE_EVENT_DURATION', {duration: maxDurationForEvent});
                                return areYouSureModalFactory(null, localizedError, null).result.then(function () {
                                    hlEventFormCtrl.event.$setEndTimeByMaxDuartion(maxDurationForEvent, durationValueBefore, value);
                                    return true;
                                }, function () {
                                    $log.info('[EventStartTimeValidator] User refuses to change end time');
                                    return $q.reject('user refuses to change end time');
                                });
                            }else if(maxDurationForEvent == -1 || maxDurationForEvent == durationValueBefore){
                                hlEventFormCtrl.event.$setEndTimeByMaxDuartion(maxDurationForEvent, durationValueBefore, value);
                                DateHolder.goToEvent(hlEventFormCtrl.event);
                                return true;
                            }else{
                                hlEventFormCtrl.event.$setEndTimeByMaxDuartion(maxDurationForEvent, durationValueBefore, value);
                                DateHolder.goToEvent(hlEventFormCtrl.event);
                                return true;
                            }
                        });

                    }, function(error){
                        if(error && error.error && ngModel.$dirty){
                            var localizedError = $filter('translate')(error.error);
                            areYouSureModalFactory(null, localizedError, {ok : true, cancel : false}, {event : error.withEvent});
                        }
                        return $q.reject('startTime overlapping');
                    });
                };

                ngModel.$validationCompleted = function(allValid, prevValue){
                    if(!allValid){
                        hlEventFormCtrl.event.data.startTime = prevValue;
                    }
                };


                var getSettingsForTimepicker = function(shift){
                    return {min : shift.startTime, range : shift.duration};
                }
                scope.startTimeSettings = getSettingsForTimepicker(ShiftsDayHolder.selectedShift);

                scope.$watch(function(){
                    return ShiftsDayHolder.selectedShift;
                }, function(newVal){
                    var newSettings = getSettingsForTimepicker(newVal);
                    if(newSettings.min.isAfter(hlEventFormCtrl.event.data.startTime, 'minutes')){
                        newSettings.min = hlEventFormCtrl.event.data.startTime.clone();
                    }
                    if(newSettings.min.clone().add(newSettings.range, 'minutes').isBefore(hlEventFormCtrl.event.data.endTime, 'minutes')){
                        newSettings.range = hlEventFormCtrl.event.data.endTime.diff(newSettings.min, 'minutes');
                    }
                    scope.startTimeSettings = newSettings;
                });
            }
        }
    }).directive('eventEndTimeValidator', function(EventsCollection, areYouSureModalFactory, $filter, $q, $timeout ){
        return {
            priority : 0,
            require : ['ngModel', '^hlEventForm'],
            link : function(scope, elem, attrs, ctrls){
                var ngModel = ctrls[0],
                    hlEventFormCtrl = ctrls[1];


                ngModel.$validators.invalidEndTime = function(modelValue, viewValue){
                    var value = modelValue || viewValue;
                    var resultError = hlEventFormCtrl.event.$validateEndTime(value);
                    if(resultError && resultError.error){
                        return false;
                    }else{
                        return true;
                    }
                }



                ngModel.$asyncValidators.validateCollisions = function(modelValue, viewValue) {
                    var value = modelValue || viewValue;
                    if(!value || !ngModel.$dirty){
                        var defer = $q.defer();
                        defer.resolve(true);
                        return defer.promise;
                    }


                    return EventsCollection.validateCollision(hlEventFormCtrl.event, {endTime : value}).then(function(){
                        return true;
                    }, function(error){
                        if(error && error.error && ngModel.$dirty){
                            var localizedError = $filter('translate')(error.error);
                            areYouSureModalFactory(null, localizedError, {ok : true, cancel : false}, {event : error.withEvent});
                        }
                        return $q.reject('startTime overlapping');
                    });
                };

                ngModel.$validationCompleted = function(allValid, prevValue){
                    if(!allValid){
                        hlEventFormCtrl.event.data.endTime = prevValue;
                    }
                };


            }
        }
    });