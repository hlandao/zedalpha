var zedAlphaFilters = zedAlphaFilters || angular.module('zedalpha.filters', []);


zedAlphaFilters
    .value('EVENT_TIME_FRAME_IN_MINUTES', 120)
    .factory('EventTimesCheck', function(EVENT_TIME_FRAME_IN_MINUTES, DeadEventsStatuses, DateHelpers, ShiftsDayHolder){
        return function(currentEvent, filters, options){
            options = angular.extend({}, options);
            if(!DateHelpers.isMomentValid(filters.clock)){
                throw new Error('Please provide a valid clock');
            }
            var isStartTimeSameAsCurrent = currentEvent.data.startTime.isSame(filters.clock, 'minute');
            var isStartingBefore = currentEvent.data.startTime.isBefore(filters.clock, 'minute');
            var startTimeDiffInMinutes = currentEvent.data.startTime.diff(filters.clock, 'minutes');
            var isEndingAfterCurrentDate = currentEvent.data.endTime.isAfter(filters.clock, 'minute');


            var isEndingBefore = currentEvent.data.endTime.isBefore(filters.clock, 'minute');
            var isEndingAt = currentEvent.data.endTime.isSame(filters.clock, 'minute');
            var isPastEvent = !!(isStartingBefore && (isEndingBefore || isEndingAt));


            var isNowEvent = !!(isStartTimeSameAsCurrent || (isStartingBefore && isEndingAfterCurrentDate));
            var isUpcomingEvent = !!((startTimeDiffInMinutes > 0 && (options.includeAllUpcomingEvents || startTimeDiffInMinutes <= EVENT_TIME_FRAME_IN_MINUTES)));
            var isDeadEvent = !!(DeadEventsStatuses.indexOf(currentEvent.data.status) >= 0);

            return {
                isPastEvent : isPastEvent,
                isNowEvent :  isNowEvent,
                isUpcomingEvent : isUpcomingEvent,
                isDeadEvent : isDeadEvent
            }
        }
    })
    .filter('sortDayEvents', function ($filter, EVENT_TIME_FRAME_IN_MINUTES, DeadEventsStatuses, DateHelpers, STATUS_FILTERS_TO_STATUSES_ARRAY, EventTimesCheck, ShiftsDayHolder) {
//        return function (eventsCollection, dateMoment, statusFilter, nameQuery, includePastEvents, includeAllUpcomingEvents) {
        return function (eventsCollection, filters, options) {
            var clock = filters.clock,
                isEntireShiftSorting = (filters.status == 'ENTIRE_SHIFT');
            if(!isEntireShiftSorting && !DateHelpers.isMomentValid(clock)){
                throw new Error('Please provide a valid clock or filter by entire_shift');
            }

            var pastEvents = [],upcomingEvents = [], nowEvents = [], deadEvents = [];

            angular.forEach(eventsCollection, function(currentEvent){
                // Check query
                if(filters.query && (currentEvent.data.name.indexOf(filters.query) === -1)){
                    return;
                }

                // Check ENTIRE_SHIFT
                if(isEntireShiftSorting){
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
                    return;

                }

                // Check Status
                if(filters.status && filters.status != 'ALL'){
                    var statusesArray = STATUS_FILTERS_TO_STATUSES_ARRAY[filters.status];
                    if(statusesArray.indexOf(currentEvent.data.status) == -1){
                        return;
                    }
                }


                // Sort by times
                var timeCheck = EventTimesCheck(currentEvent, filters, options);
                var isPastEvent = timeCheck.isPastEvent;
                var isNowEvent = timeCheck.isNowEvent;
                var isUpcomingEvent = timeCheck.isUpcomingEvent;
                var isDeadEvent = timeCheck.isDeadEvent;



                if(isDeadEvent){
                    deadEvents.push(currentEvent);
                    return;
                }


                if (isNowEvent) {
                    nowEvents.push(currentEvent);
                } else if (isUpcomingEvent) {
                    upcomingEvents.push(currentEvent);
                }else if(isPastEvent && options.includePastEvents){
                    pastEvents.push(currentEvent);
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