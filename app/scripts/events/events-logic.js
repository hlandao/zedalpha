var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('EventsLogic', function(EventsHolder, BusinessHolder, EventsDurationForGuestsHolder, FullDateFormat,GuestsPer15, $q, ShiftsDayHolder, DateHelpers){
        var DEFAULT_EVENT_DURATION = (EventsDurationForGuestsHolder && EventsDurationForGuestsHolder.default) || 120;
        var notCollidingEventStatuses = ['NO_SHOW','FINISHED','CANCELED'];



        //------- EVENT VALIDATIONS -------//

        /**
         * checks if the event is invalid while editing
         * only the most important things (collisions with other events)
         * @param event
         * @returns {*}
         */
        var isInvalidEventWhileEdit = function(event){
            if(checkCollisionsForEvent(event)){
                return {error : "ERROR_EVENT_MSG_COLLISION"};
            }
            return false;
        };


        /**
         * checks if the event is valid for save
         * @param event
         * @returns {Promise|*}
         */
        var isInvalidEventBeforeSave = function(event){
            return checkCollision(event).then(checkPhone).then(checkName).then(checkStartTime).then(checkEndTime).then(checkSeats).then(checkHost).then(checkEventWarnings);
        };


        //------- EVENT ERRORS -------//
        /**
         * validates @event name
         * @param event
         * @returns {Function||promise|promise|promise|HTMLElement|*}
         */
        var checkName = function(event){
            var defer = $q.defer();
            if(!event.name){
                defer.reject({error : "ERROR_EVENT_MSG_NAME"});
            }else{
                defer.resolve(event);
            }
            return defer.promise;
        }


        /**
         * validates @event seats
         * @param event
         * @returns {Function||promise|promise|promise|HTMLElement|*}
         */
        var checkSeats = function(event){
            var defer = $q.defer();

            if(isEventWithNoSeats(event) && (BusinessHolder.businessType != 'Bar' || !event.isOccasional)){
                defer.reject({error : "ERROR_EVENT_MSG_SEATS"});
            }else{
                defer.resolve(event);
            }
            return defer.promise;
        }


        /**
         * validate @event hostess
         * @param event
         * @returns {Function||promise|promise|promise|HTMLElement|*}
         */
        var checkHost = function(event){
            var defer = $q.defer();
            if(!event.hostess && BusinessHolder.businessType != 'Bar' && !event.isOccasional){
                defer.reject({error : "ERROR_EVENT_MSG_HOST"});
            }else{
                defer.resolve(event);
            }
            return defer.promise;
        }


        /**
         * validates @event phone
         * @param event
         * @returns {Function||promise|promise|promise|HTMLElement|*}
         */
        var checkPhone = function(event){
            var defer = $q.defer();
            if(!event.isOccasional && !event.phone){
                defer.reject({error : "ERROR_EVENT_MSG_PHONE"});
            }else{
                defer.resolve(event);
            }
            return defer.promise;
        }


        /**
         * validates @event startTime
         * @param event
         * @returns {Function||promise|promise|promise|HTMLElement|*}
         */
        var checkStartTime = function(event){
            var defer = $q.defer();
            if(!event.startTime){
                defer.reject({error : "ERROR_EVENT_MSG_STARTTIME"});
            }else{
                defer.resolve(event);
            }
            return defer.promise;
        }


        /**
         * validates @event endTime
         * @param event
         * @returns {Function||promise|promise|promise|HTMLElement|*}
         */
        var checkEndTime = function(event){
            var defer = $q.defer();
            var endTimeMoment = moment(event.endTime);
            var startTimeMoment = moment(event.startTime);
            if(!event.endTime){
                defer.reject({error : "ERROR_EVENT_MSG_ENDTIME"});
            } else if (endTimeMoment <= startTimeMoment){
                defer.reject({error : "ERROR_EVENT_MSG_ENDTIME_LT_STARTTIME"});
            }else{
                defer.resolve(event);
            }
            return defer.promise;
        }


        /**
         * validates @event for collisions
         * @param event
         * @returns {Function||promise|promise|promise|HTMLElement|*}
         */
        var checkCollision = function(event){
            var defer = $q.defer();
            if(checkCollisionsForEvent(event)){
                defer.reject({error : "ERROR_EVENT_MSG_COLLISION"});
            }else{
                defer.resolve(event);
            }
            return defer.promise;
        }


        //------- EVENT WARNINGS -------//
        /**
         * validate @event warning : (guestsPer15, eventWithinShifts)
         * @param event
         * @returns {Promise|*}
         */
        var checkEventWarnings = function(event){
            var warnings = {warnings : []};
            var promises = [checkGuestsPer15(event), checkEventWithinShifts(event)];

            return $q.all(promises).then(function(result){
                for (var i =0; i < result.length; ++i){
                    if(result[i]) warnings.warnings.push(result[i]);
                }
                return warnings;
            });
        };


        /**
         * checks the guests per 15 minutes limitation on the event
         * @param event
         * @returns {Function||promise|promise|promise|HTMLElement|*}
         */
        var checkGuestsPer15 = function(event){
            var defer = $q.defer();
            if(!isGuestsPer15Valid(event)){
                defer.resolve({warning : "INVALID_GUESTS_PER_15_WARNING"});
            }else{
                defer.resolve();
            }
            return defer.promise;
        }


        /**
         * validtes guests per 15 limitation for an event
         * @param event
         * @returns {boolean}
         */
        var isGuestsPer15Valid = function(event){
            var guestPer15Value = parseInt(GuestsPer15.$value);
            if(!guestPer15Value || guestPer15Value === 0 || !event.guests) return true;
            if(!event || !event.startTime) return false;
            var startTimeMoment = moment(event.startTime);
            var guestsCount = _.reduce(EventsHolder.$allEvents, function(guestsCount, _event, key){
                if(!_event || key == '$id' || typeof _event == "function" || _event === event) return guestsCount;
                var eventStartTimeMoment = moment(_event.startTime);
                var isOccasional = _event.isOccasional;
                var diff = startTimeMoment.diff(eventStartTimeMoment, 'minutes');
                if(!isOccasional && diff == 0){
                    return parseInt(guestsCount) + parseInt(_event.guests);
                }else{
                    return guestsCount;
                }
            }, 0);
            guestsCount += parseInt(event.guests);
            return guestsCount <= guestPer15Value;
        };



        /**
         * checks if the event is within the shifts
         * @param event
         * @returns {Function||promise|promise|promise|HTMLElement|*}
         */
        var checkEventWithinShifts = function(event){
            var defer = $q.defer();

            isEventWithinTodayShifts(event).then(function(result){
                if(result){
                    defer.resolve();
                }else{
                    defer.resolve({warning : "WARNING_OUT_OF_SHIFTS"});
                }
            });

            return defer.promise;

        }


        /**
         * checks if event is within today's/yesterday's shifts
         * @param event
         * @returns {*|HTMLElement|Promise|Promise|!Promise.<R>|then}
         */
        var isEventWithinTodayShifts = function(event){
            return dayShiftsForDate(event.startTime).then(function(dayShifts){
                var shifts = dayShifts.shifts, currentShift,startDateMoment,endDateMoment, theDateMoment = moment(event.startTime);
                for (var i = 0; i < shifts.length; ++i){
                    currentShift = shifts[i];
                    startDateMoment = moment(currentShift.startTime);
                    endDateMoment = moment(currentShift.endTime);
                    if(theDateMoment.diff(startDateMoment, 'minutes') >= 0 && endDateMoment.diff(theDateMoment, 'minutes') >= 0 ){
                        return currentShift;
                    }
                }

                // check the day before
                var theDayBefore = theDateMoment.subtract(1, 'days');
                return dayShiftsForDate(theDayBefore).then(function(dayShifts){
                    var shifts = dayShifts.shifts, currentShift,startDateMoment,endDateMoment, theDateMoment = moment(event.startTime);
                    for (var i = 0; i < shifts.length; ++i){
                        currentShift = shifts[i];
                        startDateMoment = moment(currentShift.startTime);
                        endDateMoment = moment(currentShift.endTime);
                        if(theDateMoment.diff(startDateMoment, 'minutes') >= 0 && endDateMoment.diff(theDateMoment, 'minutes') >= 0 ){
                            return currentShift;
                        }
                    }

                    return false;

                });
            });
        };


        /**
         * helper function for checking if event is within shifts
         * return promise with day-shifts
         * @param date
         * @returns {*}
         */
        var dayShiftsForDate = function(date){
            var shiftDateMoment = moment(ShiftsDayHolder.current.date);
            var theDateMoment = moment(date);
            if(ShiftsDayHolder.current.name != "ENTIRE_DAY" && shiftDateMoment.dayOfYear() == theDateMoment.dayOfYear()){
                var defer = $q.defer();
                defer.resolve(ShiftsDayHolder.current)
                return defer.promise;
            }

            return ShiftsDayHolder.fetchShiftWithDateFromDB(date);
        }



        //------- COLLISIONS & DURATIONS --------//
        /**
         * return TRUE if the @event collides with another event
         * @param event
         * @returns {boolean}
         */
        var checkCollisionsForEvent = function(event){
            var eventToCheck, sharedSeats, isCollidingStatus;
            for(var i in EventsHolder.$allEvents){
                eventToCheck = EventsHolder.$allEvents[i];
                if(!eventToCheck || i == '$id' || typeof eventToCheck == "function" || eventToCheck === event) continue;
                sharedSeats = checkIfTwoEventsShareTheSameSeats(event, eventToCheck);

                if(sharedSeats && eventShouldCollide(eventToCheck)){
                    if(checkIfTwoEventsCollideInTime(event, eventToCheck)){
                        return true;
                    }
                }
            }
            return false;
        };


        /**
         * returns TRUE if @eventToCheck collides with @e2
         * @param eventToCheck - EVENT
         * @param e2 - EVENT
         * @returns {boolean}
         */
        var checkIfTwoEventsCollideInTime = function(eventToCheck, e2){
            if(!eventToCheck || !e2) return false;
            var eventToCheckStartTimeMoment = moment(eventToCheck.startTime);
            var eventToCheckEndTimeMoment = moment(eventToCheck.endTime);
            var e2StartTimeMoment = moment(e2.startTime);
            var e2EndTimeMoment = moment(e2.endTime);

            var startTimesDiff = e2StartTimeMoment.diff(eventToCheckStartTimeMoment, 'minutes');
            var eventToCheckEndTimeDiffE2StartTime = eventToCheckEndTimeMoment.diff(e2StartTimeMoment, 'minutes');
            var eventToCheckStartTimeDiffE2EndTime = eventToCheckStartTimeMoment.diff(e2EndTimeMoment, 'minutes');


            var isStartingBeforeEndAfter = (startTimesDiff >= 0) && (eventToCheckEndTimeDiffE2StartTime > 0);
            var isStartingAfter = (startTimesDiff <= 0) && (eventToCheckStartTimeDiffE2EndTime < 0);
            return (isStartingBeforeEndAfter || isStartingAfter);
        };


        /**
         * return TRUE if @e1 and @e2 shares at least one seat
         * @param e1
         * @param e2
         * @returns {boolean}
         */
        var checkIfTwoEventsShareTheSameSeats = function(e1,e2){
            if(!e1 || !e2) return false;
            for(var i  in e1.seats){
                if(e2.seats[i]) return true;
            }
            return false;
        }


        /**
         * returns the max duration in minutes we can apply to @event
         * will return -1 if there's not limit.
         * @param event, the *new* event we want to create
         * @returns {number}
         */
        var maxDurationForEventInMinutes = function(event){
            var eventToCheckAgainst, maxDuration = -1,tempMaxDuration;
            for(var i in EventsHolder.$allEvents){
                eventToCheckAgainst = EventsHolder.$allEvents[i];
                if(!eventToCheckAgainst || i == '$id' || typeof eventToCheckAgainst == "function" || eventToCheckAgainst === event) continue;
                if(checkIfTwoEventsShareTheSameSeats(event, eventToCheckAgainst) && eventShouldCollide(eventToCheckAgainst)){
                    tempMaxDuration =  maxDurationForEventInRegardToAnotherEvent(event, eventToCheckAgainst);
                    if(tempMaxDuration === 0){
                        return 0;
                    }else if(tempMaxDuration > 0){
                        maxDuration = (maxDuration == -1) ? tempMaxDuration : Math.min(tempMaxDuration, maxDuration);
                    }else{

                    }
                }
            }
            return maxDuration;
        }


        /**
         * return TRUE if the event is a colliding event
         * means that its status isn't in the notCollidingEventStatuses array : 'NO_SHOW','FINISHED','CANCELED'
         * @param event
         * @returns {boolean}
         */
        var eventShouldCollide = function(event){
            return (event && event.status && event.status.status) ? (notCollidingEventStatuses.indexOf(event.status.status) == -1) : false ;
        }



        /**
         * returns the maximum duration allowed for event(@eventToCheck) in regard to another evnet (@e2)
         * @param eventToCheck
         * @param e2
         * @returns {*}
         */
        var maxDurationForEventInRegardToAnotherEvent = function(eventToCheck, e2){
            if(!eventToCheck || !e2) return false;
            var eventToCheckStartTimeMoment = moment(eventToCheck.startTime);
            var eventToCheckEndTimeMoment = moment(eventToCheck.endTime);
            var e2StartTimeMoment = moment(e2.startTime);
            var e2EndTimeMoment = moment(e2.endTime);

            var e2StartTimeDiffEventToCheckStartTime = e2StartTimeMoment.diff(eventToCheckStartTimeMoment, 'minutes');
            var e2EndTimeDiffEventToCheckStartTime = e2EndTimeMoment.diff(eventToCheckStartTimeMoment, 'minutes');

            if(e2StartTimeDiffEventToCheckStartTime > 0){
                // the event_to_check start before e2 begins
                return e2StartTimeDiffEventToCheckStartTime;
            }else if (e2EndTimeDiffEventToCheckStartTime < 0){
                // the event_to_check start after e2 ends
                return -1;
            }else{
                return 0;
            }
        };


        /**
         * applies new end time, taking into account the startTime and the maxDuration allowed
         * @param startTime
         * @param maxDuration
         * @returns {Date}
         */
        var endTimeForNewEventWithStartTimeAndMaxDuration = function(startTime, maxDuration){
            var duration = maxDuration > 0 ? Math.min(maxDuration, DEFAULT_EVENT_DURATION) : DEFAULT_EVENT_DURATION ;
            return new Date(moment(startTime).add('minute', duration).format(FullDateFormat));
        };



        /**
         * check if event has not seats attached
         * @param event
         * @returns {*}
         */
        var isEventWithNoSeats = function(event){
            return isEmptyObject(event.seats)
        };


        /**
         * returns startTime for event in regard to the time interval (every 15 minutes)
         * @param startTime
         * @returns {Date}
         */
        var startTimeAccordingToTimeInterval = function(startTime){
            var startTimeMoment = moment(startTime);
            var minutes = DateHelpers.findClosestIntervalToDate(startTime);
            startTimeMoment.minutes(minutes);
            return new Date(startTimeMoment.format(FullDateFormat));
        };



        var updateEventDuration = function(event, duration){
            if(!duration) return;
            var startTimeMoment = moment(event.startTime);
            return event.endTime = startTimeMoment.add(duration, 'minutes').format(FullDateFormat);

        };

        var eventDurationForGuestsNumber = function(guests){
            return EventsDurationForGuestsHolder[parseInt(guests)];
        };


        var validateEventsSwitching = function(e1, e2){
            var e1OriginalSeats = angular.copy(e1.seats),
                e2OriginalSeats = angular.copy(e2.seats);
            e1.seats = e2OriginalSeats;
            e2.seats = e1OriginalSeats;
            if(checkCollisionsForEvent(e1) || checkCollisionsForEvent(e2)){
                e1.seats = e1OriginalSeats;
                e2.seats = e2OriginalSeats;
                return {error : "ERROR_EVENT_SWITCH_COLLISION"};
            }

        };

        return {
            isInvalidEventBeforeSave : isInvalidEventBeforeSave,
            isInvalidEventWhileEdit : isInvalidEventWhileEdit,
            validateEventsSwitching : validateEventsSwitching,
            checkCollisionsForEvent : checkCollisionsForEvent,
            endTimeForNewEventWithStartTimeAndMaxDuration : endTimeForNewEventWithStartTimeAndMaxDuration,
            maxDurationForEventInMinutes : maxDurationForEventInMinutes,
            isGuestsPer15Valid : isGuestsPer15Valid,
            startTimeAccordingToTimeInterval : startTimeAccordingToTimeInterval,
            eventDurationForGuestsNumber : eventDurationForGuestsNumber,
            updateEventDuration : updateEventDuration
        }

    });