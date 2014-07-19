var zedAlphaFilters = zedAlphaFilters || angular.module('zedalpha.filters', []);


zedAlphaFilters

    .filter('eventsByTime', function(DateHolder){
        return function(events){
            // include events that starts X minutes after the current time
            var EVENT_TIME_FRAME_IN_MINUTES = 120;

            var currentDateMoment = moment(DateHolder.current);
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
    }).filter('eventsByEntireShift', function(DateHolder){
        return function(events,shift){
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
                var isEditingNow = event.helpers && event.helpers.isEditing;
                if(isEditingNow || isStartingAtShift ){
                    event.$id = key;
                    filteredEventsArr.push(event);
                }
            });

            return filteredEventsArr;
        }
    })

