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

    }).factory('EventsLogic', function(EventsHolder, BusinessHolder, EventsDurationForGuestsHolder, FullDateFormat){
        var DEFAULT_EVENT_DURATION = _.findWhere(EventsDurationForGuestsHolder, {guests : 'default'}).duration || 90;
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
            var isStartingBeforeEndAfter = (eventToCheckStartTimeMoment <= e2StartTimeMoment) && (eventToCheckEndTimeMoment > e2StartTimeMoment);
            var isStartingAfter = (eventToCheckStartTimeMoment >= e2StartTimeMoment) && (eventToCheckStartTimeMoment < e2EndTimeMoment);
            return (isStartingBeforeEndAfter || isStartingAfter);
        };


        var checkIfTwoEventsShareTheSameSeats = function(e1,e2){
            if(!e1 || !e2) return false;
            for(var i  in e1.seats){
                if(e2.seats[i]) return i;
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
            var isE2StartBeforeAndEndAfter = e2StartTimeMoment <= eventToCheckStartTimeMoment && e2EndTimeMoment > eventToCheckStartTimeMoment;
            return isE2StartBeforeAndEndAfter ? 0 : Math.max(-1, e2StartTimeMoment.diff(eventToCheckStartTimeMoment, 'minutes')) ;
        };


        var isInValidateEventWhileEdit = function(event){
            if(checkCollisionsForEvent(event)){
                return "ERROR_EVENT_MSG_COLLISION";
            }
        };

        var isInValidateEventBeforeSave = function(event){

            // Event has no name
            if(!event.name){
                return "ERROR_EVENT_MSG_NAME";
            // Event has no seat or it is an occasional one and the business type is Bar
            } else if(isEventWithNoSeats(event) && (BusinessHolder.businessType != 'Bar' || !event.isOccasional)){
                return "ERROR_EVENT_MSG_SEATS";
            // Event has no phone and it isn't occasional
            }else if(!event.isOccasional && !event.phone){
                return "ERROR_EVENT_MSG_PHONE";
            // Event has no start time
            }else if(!event.startTime){
                return "ERROR_EVENT_MSG_STARTTIME";
            // Event has no end time
            }else if(!event.endTime){
                return "ERROR_EVENT_MSG_ENDTIME";
            }else if(checkCollisionsForEvent(event)){
                return "ERROR_EVENT_MSG_COLLISION";
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

        return {
            isInValidateEventBeforeSave : isInValidateEventBeforeSave,
            isInValidateEventWhileEdit : isInValidateEventWhileEdit,
            checkCollisionsForEvent : checkCollisionsForEvent,
            endTimeForNewEventWithStartTimeAndMaxDuration : endTimeForNewEventWithStartTimeAndMaxDuration,
            maxDurationForEventInMinutes : maxDurationForEventInMinutes
        }

    });