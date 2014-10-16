var zedAlphaFilters = zedAlphaFilters || angular.module('zedalpha.filters', []);


zedAlphaFilters
    .value('EVENT_TIME_FRAME_IN_MINUTES', 120)
    .factory('EventTimesCheck', function(EVENT_TIME_FRAME_IN_MINUTES, DeadEventsStatuses){
        return function(currentEvent, _dateMoment, includeAllUpcomingEvents){
            var isStartTimeSameAsCurrent = currentEvent.data.startTime.isSame(_dateMoment, 'minute');
            var isStartingBefore = currentEvent.data.startTime.isBefore(_dateMoment, 'minute');
            var startTimeDiffInMinutes = currentEvent.data.startTime.diff(_dateMoment, 'minutes');
            var isEndingAfterCurrentDate = currentEvent.data.endTime.isAfter(_dateMoment, 'minute');


            var isEndingBefore = currentEvent.data.endTime.isBefore(_dateMoment, 'minute');
            var isEndingAt = currentEvent.data.endTime.isSame(_dateMoment, 'minute');
            var isPastEvent = !!(isStartingBefore && (isEndingBefore || isEndingAt));


            var isNowEvent = !!(isStartTimeSameAsCurrent || (isStartingBefore && isEndingAfterCurrentDate));
            var isUpcomingEvent = !!((startTimeDiffInMinutes > 0 && (includeAllUpcomingEvents || startTimeDiffInMinutes <= EVENT_TIME_FRAME_IN_MINUTES)));
            var isDeadEvent = !!(DeadEventsStatuses.indexOf(currentEvent.data.status) >= 0);

            return {
                isPastEvent : isPastEvent,
                isNowEvent :  isNowEvent,
                isUpcomingEvent : isUpcomingEvent,
                isDeadEvent : isDeadEvent
            }
        }
    })
    .filter('sortDayEvents', function ($filter, EVENT_TIME_FRAME_IN_MINUTES, DeadEventsStatuses, DateHelpers, STATUS_FILTERS_TO_FILTER, ShiftsDayHolder, EventTimesCheck) {
        return function (eventsCollection, dateMoment, statusFilter, nameQuery, includePastEvents, includeAllUpcomingEvents) {
            var _dateMoment = DateHelpers.isMomentValid(dateMoment) ? dateMoment.clone() : null;
            var pastEvents = [],upcomingEvents = [], nowEvents = [], deadEvents = [];

            angular.forEach(eventsCollection, function(currentEvent){
                var status = currentEvent.data.status;

                if(nameQuery && (currentEvent.data.name.indexOf(nameQuery) === -1)){
                    return;
                }

                var timeCheck = EventTimesCheck(currentEvent, _dateMoment, includeAllUpcomingEvents);

                var isPastEvent = timeCheck.isPastEvent;
                var isNowEvent = timeCheck.isNowEvent;
                var isUpcomingEvent = timeCheck.isUpcomingEvent;
                var isDeadEvent = timeCheck.isDeadEvent;

                if(statusFilter == 'ENTIRE_SHIFT'){
                    var shift = ShiftsDayHolder.selectedShift;
                    if(shift.isEventWithin(currentEvent)){
                        if(isDeadEvent){
                            deadEvents.push(currentEvent);
                            return;
                        }else{
                            nowEvents.push(currentEvent);
                            return;
                        }
                    }

                }else{
                    if(isDeadEvent){
                        deadEvents.push(currentEvent);
                        return;
                    }

                    if(statusFilter && statusFilter != 'ALL'){
                        var filter = STATUS_FILTERS_TO_FILTER[statusFilter];
                        if(filter.indexOf(status) == -1){
                            return;
                        }
                    }

                    if (isNowEvent) {
                        nowEvents.push(currentEvent);
                    } else if (isUpcomingEvent) {
                        upcomingEvents.push(currentEvent);
                    }else if(isPastEvent && includePastEvents){
                        pastEvents.push(currentEvent);
                    }
                }

            });

            return {
                deadEvents : deadEvents,
                pastEvents : pastEvents,
                nowEvents: nowEvents,
                upcomingEvents: upcomingEvents
            }
        }
    }).filter('eventsByShift', function(ShiftsDayHolder){
        return function(events, shift){
            if(!events) return [];
            shift = shift || ShiftsDayHolder.selectedShift;
            return _.filter(events, function(event){
                return shift.isEventWithin(event);
            });
        }
    }).filter('eventsBySeats', function(){
        return function(events, seats){
            if(!events || !seats) return [];
            return _.filter(events, function(event){
                return event.$sharingTheSameSeatsWithAnotherEvent(null, seats);
            });
        }
    });