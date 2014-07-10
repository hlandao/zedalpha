var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('EventsHolder', function($rootScope,BusinessHolder, DateHolder){
        var $events = {$allEvents : null};
        var updateEvents = function(){
            if(BusinessHolder.$business){
                $events.$allEvents = BusinessHolder.$business.$child('events');
            }
        };

        $rootScope.$on('$businessHolderChanged', updateEvents);
        updateEvents();
//        $rootScope.$watch(function(){
//            return DateHolder.current;
//        }, updateEvents);


        return $events;

    }).factory('EventsLogic', function(EventsHolder, BusinessHolder, EventsDurationForGuestsHolder, FullDateFormat,GuestsPer15, $q){
        var DEFAULT_EVENT_DURATION = _.findWhere(EventsDurationForGuestsHolder, {guests : 'default'}).duration || 90;
        var checkCollisionsForEvent = function(event){
            var eventToCheck, sharedSeats;
            for(var i in EventsHolder.$allEvents){
                eventToCheck = EventsHolder.$allEvents[i];
                console.log('eventToCheck === event',eventToCheck === event);
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
                    console.log('eventToCheckAgainst',eventToCheckAgainst);

                    tempMaxDuration =  maxDurationForEventInRegardToAnotherEvent(event, eventToCheckAgainst);
                    console.log('tempMaxDuration',tempMaxDuration);
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
            var defer = $q.defer();
            // Event has no name
            if(!event.name){
                return {error : "ERROR_EVENT_MSG_NAME"};
            // Event has no seat or it is an occasional one and the business type is Bar
            } else if(isEventWithNoSeats(event) && (BusinessHolder.businessType != 'Bar' || !event.isOccasional)){
                return {error : "ERROR_EVENT_MSG_SEATS"};
            // Event has no phone and it isn't occasional
            }else if(!event.isOccasional && !event.phone){
                return {error : "ERROR_EVENT_MSG_PHONE"};
            // Event has no start time
            }else if(!event.startTime){
                return {error : "ERROR_EVENT_MSG_STARTTIME"};
            // Event has no end time
            }else if(!event.endTime){
                return {error : "ERROR_EVENT_MSG_ENDTIME"};
            }else if(checkCollisionsForEvent(event)){
                return {error : "ERROR_EVENT_MSG_COLLISION"};
            }else if(!isGuestsPer15Valid(event)){
                return {warning : "INVALID_GUESTS_PER_15_WARNING"};
            }

            return false;

        };

        var isEventWithNoSeats = function(event){
            return isEmptyObject(event.seats)
        }

        var endTimeForNewEventWithStartTimeAndMaxDuration = function(startTime, maxDuration){
            var duration = maxDuration > 0 ? Math.min(maxDuration, DEFAULT_EVENT_DURATION) : DEFAULT_EVENT_DURATION ;
            return new Date(moment(startTime).add('minute', duration).format(FullDateFormat));
        };

        var isGuestsPer15Valid = function(event){
            var guestPer15Value = parseInt(GuestsPer15.$value);
            if(!guestPer15Value || guestPer15Value === 0) return true;
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


        return {
            isInvalidEventBeforeSave : isInvalidEventBeforeSave,
            isInvalidEventWhileEdit : isInvalidEventWhileEdit,
            checkCollisionsForEvent : checkCollisionsForEvent,
            endTimeForNewEventWithStartTimeAndMaxDuration : endTimeForNewEventWithStartTimeAndMaxDuration,
            maxDurationForEventInMinutes : maxDurationForEventInMinutes,
            isGuestsPer15Valid : isGuestsPer15Valid
        }

    });