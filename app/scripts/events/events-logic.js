var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('EventsLogic', function(EventsHolder, BusinessHolder, EventsDurationForGuestsHolder, FullDateFormat,GuestsPer15, $q, ShiftsDayHolder, DateHelpers){
        var DEFAULT_EVENT_DURATION = (EventsDurationForGuestsHolder && EventsDurationForGuestsHolder.default) || 120;
        var checkCollisionsForEvent = function(event){
            var eventToCheck, sharedSeats;
            for(var i in EventsHolder.$allEvents){
                eventToCheck = EventsHolder.$allEvents[i];
                if(!eventToCheck || i == '$id' || typeof eventToCheck == "function" || eventToCheck === event) continue;
                sharedSeats = checkIfTwoEventsShareTheSameSeats(event, eventToCheck);
                if(sharedSeats){
                    if(checkIfTwoEventsCollideInTime(event, eventToCheck)){
                        return true;
                    }
                }
            }
            return false;
        };

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


        var checkIfTwoEventsShareTheSameSeats = function(e1,e2){
            if(!e1 || !e2) return false;
            for(var i  in e1.seats){
                if(e2.seats[i]) return true;
            }
            return false;
        }

        var maxDurationForEventInMinutes = function(event){
            var eventToCheckAgainst, sharedSeats, maxDuration = -1,tempMaxDuration;
            for(var i in EventsHolder.$allEvents){
                eventToCheckAgainst = EventsHolder.$allEvents[i];
                if(!eventToCheckAgainst || i == '$id' || typeof eventToCheckAgainst == "function" || eventToCheckAgainst === event) continue;
                sharedSeats = checkIfTwoEventsShareTheSameSeats(event, eventToCheckAgainst);
                if(sharedSeats){
                    tempMaxDuration =  maxDurationForEventInRegardToAnotherEvent(event, eventToCheckAgainst);
                    if(tempMaxDuration == 0){
                        return 0;
                    }else if(tempMaxDuration > 0){
                        maxDuration = (maxDuration == -1) ? tempMaxDuration : Math.min(tempMaxDuration, maxDuration);
                    }else{

                    }
                }
            }
            return maxDuration;
        }

        var maxDurationForEventInRegardToAnotherEvent = function(eventToCheck, e2){
            if(!eventToCheck || !e2) return false;
            var eventToCheckStartTimeMoment = moment(eventToCheck.startTime);
            var eventToCheckEndTimeMoment = moment(eventToCheck.endTime);
            var e2StartTimeMoment = moment(e2.startTime);
            var e2EndTimeMoment = moment(e2.endTime);

            var e2StartTimeDiffEventToCheckStartTime = e2StartTimeMoment.diff(eventToCheckStartTimeMoment, 'minutes');
            var e2EndTimeDiffEventToCheckStartTime = e2EndTimeMoment.diff(eventToCheckStartTimeMoment, 'minutes');


            var isE2StartBeforeAndEndAfter = e2StartTimeDiffEventToCheckStartTime <= 0 && e2EndTimeDiffEventToCheckStartTime > 0;


            return isE2StartBeforeAndEndAfter ? 0 : Math.max(-1, e2StartTimeMoment.diff(eventToCheckStartTimeMoment, 'minutes')) ;
        };



        var isInvalidEventWhileEdit = function(event){
            if(checkCollisionsForEvent(event)){
                return {error : "ERROR_EVENT_MSG_COLLISION"};
            }
            return false;
        };


        var isInvalidEventBeforeSave = function(event){
            return checkName(event).then(checkSeats).then(checkHost).then(checkPhone).then(checkStartTime).then(checkEndTime).then(checkCollision).then(checkEventWarnings);
        };

        var checkName = function(event){
            var defer = $q.defer();
            if(!event.name){
                defer.reject({error : "ERROR_EVENT_MSG_NAME"});
            }else{
                defer.resolve(event);
            }
            return defer.promise;
        }

        var checkSeats = function(event){
            var defer = $q.defer();

            if(isEventWithNoSeats(event) && (BusinessHolder.businessType != 'Bar' || !event.isOccasional)){
                defer.reject({error : "ERROR_EVENT_MSG_SEATS"});
            }else{
                defer.resolve(event);
            }
            return defer.promise;
        }


        var checkHost = function(event){
            var defer = $q.defer();
            if(!event.hostess && BusinessHolder.businessType != 'Bar' && !event.isOccasional){
                defer.reject({error : "ERROR_EVENT_MSG_HOST"});
            }else{
                defer.resolve(event);
            }
            return defer.promise;
        }


        var checkPhone = function(event){
            var defer = $q.defer();
            if(!event.isOccasional && !event.phone){
                defer.reject({error : "ERROR_EVENT_MSG_PHONE"});
            }else{
                defer.resolve(event);
            }
            return defer.promise;
        }

        var checkStartTime = function(event){
            var defer = $q.defer();
            if(!event.startTime){
                defer.reject({error : "ERROR_EVENT_MSG_STARTTIME"});
            }else{
                defer.resolve(event);
            }
            return defer.promise;
        }

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


        var checkCollision = function(event){
            var defer = $q.defer();
            if(checkCollisionsForEvent(event)){
                defer.reject({error : "ERROR_EVENT_MSG_COLLISION"});
            }else{
                defer.resolve(event);
            }
            return defer.promise;
        }


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


        var checkGuestsPer15 = function(event){
            var defer = $q.defer();
            if(!isGuestsPer15Valid(event)){
                defer.resolve({warning : "INVALID_GUESTS_PER_15_WARNING"});
            }else{
                defer.resolve();
            }
            return defer.promise;
        }


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





        var isEventWithNoSeats = function(event){
            return isEmptyObject(event.seats)
        }

        var endTimeForNewEventWithStartTimeAndMaxDuration = function(startTime, maxDuration){
            var duration = maxDuration > 0 ? Math.min(maxDuration, DEFAULT_EVENT_DURATION) : DEFAULT_EVENT_DURATION ;
            return new Date(moment(startTime).add('minute', duration).format(FullDateFormat));
        };


        var isEventWithinTodayShifts = function(event){
            return dayShiftsForDate(event.startTime).then(function(dayShifts){
                var shifts = dayShifts.shifts, currentShift,startDateMoment,endDateMoment, theDateMoment = moment(event.startTime);
                for (var i = 0; i < shifts.length; ++i){
                    currentShift = shifts[i];
                    startDateMoment = moment(currentShift.startTime);
                    endDateMoment = moment(currentShift.endTime);
                    if(theDateMoment >= startDateMoment && theDateMoment <= endDateMoment){
                        return true;
                    }
                }

                return false;

            });
        };

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



        var isGuestsPer15Valid = function(event){
            var guestPer15Value = parseInt(GuestsPer15.$value);
            if(!guestPer15Value || guestPer15Value === 0 || !event.guests) return true;
            if(!event || !event.startTime) return false;
            var startTimeMoment = moment(event.startTime);
            var guestsCount = _.reduce(EventsHolder.$allEvents, function(guestsCount, _event, key){
                if(!_event || key == '$id' || typeof _event == "function") return guestsCount;
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
            console.log('guestsCount',guestsCount,guestPer15Value);
            return guestsCount <= guestPer15Value;
        };


        var startTimeAccordingToTimeInterval = function(startTime){
            var startTimeMoment = moment(startTime);
            var minutes = DateHelpers.findClosestIntervalToDate(startTime);
            startTimeMoment.minutes(minutes);
            return new Date(startTimeMoment.format(FullDateFormat));
        }

        return {
            isInvalidEventBeforeSave : isInvalidEventBeforeSave,
            isInvalidEventWhileEdit : isInvalidEventWhileEdit,
            checkCollisionsForEvent : checkCollisionsForEvent,
            endTimeForNewEventWithStartTimeAndMaxDuration : endTimeForNewEventWithStartTimeAndMaxDuration,
            maxDurationForEventInMinutes : maxDurationForEventInMinutes,
            isGuestsPer15Valid : isGuestsPer15Valid,
            startTimeAccordingToTimeInterval : startTimeAccordingToTimeInterval
        }

    });