var zedAlphaFilters = zedAlphaFilters || angular.module('zedalpha.filters', []);


zedAlphaFilters
    .value('EVENT_TIME_FRAME_IN_MINUTES', 120)
    .value('DEAD_EVENTS_STATUSES', ["FINISHED", "NO_SHOW","CANCELED"])
    .value('STATUS_FILTERS_TO_FILTER', {
        ALL : ['ALL'],
        SEATED : ['SEATED', 'CHEQUE', ''],
        ORDERED : ['ORDERED', 'CONFIRMED'],
        OCCASIONAL : ['OCCASIONAL']
    })
    .filter('sortDayEvents', function ($filter, EVENT_TIME_FRAME_IN_MINUTES, DEAD_EVENTS_STATUSES, DateHelpers, STATUS_FILTERS_TO_FILTER, ShiftsDayHolder) {
        return function (eventsCollection, dateMoment, statusFilter, nameQuery) {
            var _dateMoment = DateHelpers.isMomentValid(dateMoment) ? dateMoment.clone() : null;
            var upcomingEvents = [], nowEvents = [], deadEvents = [];
            var currentEvent,key, status, isStartTimeSameAsCurrent, isStartingBefore, startTimeDiffInMinutes, isEndingAfterCurrentDate, isNowEvent, isUpcomingEvent, isDeadEvent;

            for (var i = 0; i < eventsCollection.length; ++i) {
                key = eventsCollection.$keyAt(i);
                currentEvent = eventsCollection.$getRecord(key);
                status = currentEvent.data.status;

                if(nameQuery && (currentEvent.data.name.indexOf(nameQuery) === -1)){
                    continue;
                }

                isStartTimeSameAsCurrent = currentEvent.data.startTime.isSame(_dateMoment, 'minute');
                isStartingBefore = currentEvent.data.startTime.isBefore(_dateMoment, 'minute');
                startTimeDiffInMinutes = currentEvent.data.startTime.diff(_dateMoment, 'minutes');
                isEndingAfterCurrentDate = currentEvent.data.endTime.isAfter(_dateMoment, 'minute');

                isNowEvent = !!(isStartTimeSameAsCurrent || (isStartingBefore && isEndingAfterCurrentDate));
                isUpcomingEvent = !!((startTimeDiffInMinutes > 0 && startTimeDiffInMinutes <= EVENT_TIME_FRAME_IN_MINUTES));
                isDeadEvent = !!(DEAD_EVENTS_STATUSES.indexOf(status) >= 0);

                if(statusFilter == 'ENTIRE_SHIFT'){
                    var shift = ShiftsDayHolder.selectedShift;
                    if(ShiftsDayHolder.currentDay.isEventWithinShift(shift, currentEvent)){
                        if(isDeadEvent){
                            deadEvents.push(currentEvent);
                            continue;
                        }else{
                            nowEvents.push(currentEvent);
                            continue;
                        }
                    }

                }else{
                    if(isDeadEvent){
                        deadEvents.push(currentEvent);
                        continue;
                    }

                    if(statusFilter && statusFilter != 'ALL'){
                        var filter = STATUS_FILTERS_TO_FILTER[statusFilter];
                        if(filter.indexOf(status) == -1){
                            continue;
                        }
                    }

                    if (isNowEvent) {
                        nowEvents.push(currentEvent);
                    } else if (isUpcomingEvent) {
                        upcomingEvents.push(currentEvent);
                    }
                }
            }

            return {
                deadEvents : deadEvents,
                nowEvents: nowEvents,
                upcomingEvents: upcomingEvents
            }
        }
    })
    .filter('eventsByTime',function (DateHolder, EVENT_TIME_FRAME_IN_MINUTES) {
        return function (events) {
            // include events that starts X minutes after the current time
            var currentDateMoment = DateHolder.currentClock.clone();
            currentDateMoment.seconds(0);
            var filteredEvents = [],
                upcomingEvents = [];

            angular.forEach(events, function (event, key) {
                if (!event || key == '$id' || typeof event == "function") return;
                var startTimeMoment = moment(event.startTime).seconds(0);
                startTimeMoment.seconds(0);
                var endTimeMoment = moment(event.endTime).seconds(0);
                endTimeMoment.seconds(0);

                var isStartTimeSameAsCurrent = startTimeMoment.isSame(currentDateMoment, 'minute');
                var isStartingBefore = startTimeMoment.isBefore(currentDateMoment, 'minute');
                var startTimeDiffInMinutes = startTimeMoment.diff(currentDateMoment, 'minutes');

                var isEndingAfterCurrentDate = currentDateMoment.isBefore(endTimeMoment, 'minute');

                if (isStartTimeSameAsCurrent || (isStartingBefore && isEndingAfterCurrentDate)) {
                    event.$id = key;
                    filteredEvents.push(event);
                } else if (startTimeDiffInMinutes >= -EVENT_TIME_FRAME_IN_MINUTES && startTimeDiffInMinutes <= EVENT_TIME_FRAME_IN_MINUTES) {
                    event.$id = key;
                    upcomingEvents.push(event);
                }
            });

            return {
                filteredEvents: filteredEvents,
                upcomingEvents: upcomingEvents
            }
        }
    }).filter('eventsByEntireShift',function () {
        return function (events, shift, includeEditingNow) {
            if (!shift || !events) return false;
            // include events that starts X minutes after the current time
//            var EVENT_TIME_FRAME_IN_MINUTES = 120;

            var shiftStartTimeMoment = moment(shift.startTime);
            var shiftEndTimeMoment = moment(shift.endTime);
            var filteredEventsArr = [];

            angular.forEach(events, function (event, key) {
                if (!event || key == '$id' || typeof event == "function") return;
                var startTimeMoment = moment(event.startTime);
                var endTimeMoment = moment(event.endTime);
                var isStartingAtShift = startTimeMoment >= shiftStartTimeMoment && startTimeMoment <= shiftEndTimeMoment;
                var isEndingWithinShift = startTimeMoment < shiftStartTimeMoment && endTimeMoment >= shiftStartTimeMoment;
                if (isStartingAtShift) {
                    event.$id = key;
                    filteredEventsArr.push(event);
                }
            });

            return filteredEventsArr;
        }
    })
.filter('eventsBySeatAndTime',function () {
        return function (events, seatNumber, from, to) {
            var filteredEventsArr = [], key, currentEvent;

            if(!events || !seatNumber){
                return filteredEventsArr;
            }


            for (var i = 0; i < events.length; ++i) {
                key = events.$keyAt(i);
                currentEvent = events.$getRecord(key);

                if(!currentEvent.data.seats[seatNumber]){
                    continue;
                }

                var fromTimeCheck = from ? currentEvent.data.startTime.diff(from, 'minutes') >= 0 : true;
                var toTimeCheck = to ? to.diff(currentEvent.data.startTime, 'minutes') >= 0 : true;
                var isStartingAtShift = fromTimeCheck && toTimeCheck;

                if (isStartingAtShift) {
                    filteredEventsArr.push(currentEvent);
                }
            }

            return filteredEventsArr;
        }
    }).filter('eventsBySeatAndShiftsDay', function (EventsCollection, $filter) {
        return function (events, seatNumber, shiftsDay) {
            var fromTimeMoment,
                toTimeMoment,
                filteredEventsArr;

            events = events || EventsCollection.collection;

            filteredEventsArr = [];

            angular.forEach(shiftsDay.shifts, function (shift) {
                var endTime = shift.startTime.clone().add(shift.duration, 'minutes');
                var moreEvents = $filter('eventsBySeatAndTime')(events, seatNumber, shift.startTime, endTime);

                filteredEventsArr = filteredEventsArr.concat(moreEvents);
            });

            return filteredEventsArr;
        }
    });


