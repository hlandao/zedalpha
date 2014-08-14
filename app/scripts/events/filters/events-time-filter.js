var zedAlphaFilters = zedAlphaFilters || angular.module('zedalpha.filters', []);


zedAlphaFilters

    .filter('eventsByTime', function(DateHolder){
        return function(events){
            // include events that starts X minutes after the current time
            var EVENT_TIME_FRAME_IN_MINUTES = 120;

            var currentDateMoment = moment(DateHolder.currentClock);
            currentDateMoment.seconds(0);
            var filteredEventsArr = [];

            angular.forEach(events, function(event, key){
                if(!event || key == '$id' || typeof event == "function") return;
                var startTimeMoment = moment(event.startTime).seconds(0);
                startTimeMoment.seconds(0);
                var endTimeMoment = moment(event.endTime).seconds(0);
                endTimeMoment.seconds(0);
                var startTimeDiffInMinutes =  startTimeMoment.diff(currentDateMoment, 'minutes');
                var endTimeDiffInMinutes =  endTimeMoment.diff(currentDateMoment, 'minutes');
                var isStartingAfterCurrentDate = startTimeDiffInMinutes > 0;
                var isEndingAfterCurrentDate = endTimeDiffInMinutes > 0;
                var isEditingNow = event.helpers && event.helpers.isEditing;
                if(isEditingNow || (startTimeDiffInMinutes == 0) || (isStartingAfterCurrentDate &&  startTimeDiffInMinutes < EVENT_TIME_FRAME_IN_MINUTES) || (!isStartingAfterCurrentDate && isEndingAfterCurrentDate)){
                    event.$id = key;
                    filteredEventsArr.push(event);
                }
            });

            return filteredEventsArr;
        }
    }).filter('eventsByEntireShift', function(){
        return function(events,shift, includeEditingNow){
            if(!shift || !events) return false;
            // include events that starts X minutes after the current time
//            var EVENT_TIME_FRAME_IN_MINUTES = 120;

            var shiftStartTimeMoment = moment(shift.startTime);
            var shiftEndTimeMoment = moment(shift.endTime);
            var filteredEventsArr = [];

            angular.forEach(events, function(event, key){
                if(!event || key == '$id' || typeof event == "function") return;
                var startTimeMoment = moment(event.startTime);
                var endTimeMoment = moment(event.endTime);
                var isStartingAtShift =  startTimeMoment >= shiftStartTimeMoment && startTimeMoment <= shiftEndTimeMoment  ;
                var isEndingWithinShift = startTimeMoment < shiftStartTimeMoment && endTimeMoment >= shiftStartTimeMoment;
                if(isStartingAtShift ){
                    event.$id = key;
                    filteredEventsArr.push(event);
                }
            });

            return filteredEventsArr;
        }
    }).filter('eventsBySeatAndTime', function(EventsHolder){
       return function(events, seatNumber, fromTime, toTime){
           var fromTimeMoment,
               toTimeMoment,
               filteredEventsArr;

           events = events || EventsHolder.$allEvents;

           fromTimeMoment = moment(fromTime);
           toTimeMoment = moment(toTime);


           filteredEventsArr = [];

           angular.forEach(events, function(event, key){
               if(!event || key == '$id' || typeof event == "function") return;
               var startTimeMoment = moment(event.startTime);
               var endTimeMoment = moment(event.endTime);
               var fromTimeCheck =  fromTime ? startTimeMoment >= fromTimeMoment : true;
               var toTimeCheck = toTime ? startTimeMoment <= toTimeMoment : true;
               var isStartingAtShift = fromTimeCheck && toTimeCheck;
               if(isStartingAtShift && event.seats[seatNumber]){
                   event.$id = key;
                   filteredEventsArr.push(event);
               }
           });
           return filteredEventsArr;

       }
    }).filter('eventsBySeatAndShiftsDay', function(EventsHolder, $filter){
        return function(events, seatNumber, shiftsDay){
            var fromTimeMoment,
                toTimeMoment,
                filteredEventsArr;

            events = events || EventsHolder.$allEvents;



            filteredEventsArr = [];

            angular.forEach(shiftsDay.shifts, function(shift){
                var moreEvents = $filter('eventsBySeatAndTime')(events, seatNumber, shift.startTime, shift.endTime);
                filteredEventsArr  = filteredEventsArr.concat(moreEvents);
            });

            return filteredEventsArr;
        }
    });

