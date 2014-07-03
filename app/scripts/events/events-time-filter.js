var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives
    .filter('eventsByTime', function(DateHolder){
        return function(events){
            // include events that starts X minutes after the current time
            var EVENT_TIME_FRAME_IN_MINUTES = 120;

            var currentDateMoment = moment(DateHolder.current);
            var filteredEventsArr = [];

            angular.forEach(events, function(event, key){
                if(!event || key == '$id' || typeof event == "function") return;
                var startTimeMoment = moment(event.startTime);
                var endTimeMoment = moment(event.endTime);
                var startTimeDiffInMinutes =  startTimeMoment.diff(currentDateMoment, 'minutes');
                var isStartingAfterCurrentDate = startTimeDiffInMinutes > 0;
                var isEndingAfterCurrentDate = endTimeMoment >= currentDateMoment;
                if((startTimeDiffInMinutes == 0) || (isStartingAfterCurrentDate &&  startTimeDiffInMinutes < EVENT_TIME_FRAME_IN_MINUTES) || (!isStartingAfterCurrentDate && isEndingAfterCurrentDate)){
                    filteredEventsArr.push(event);
                }
            });

            return filteredEventsArr;
        }
    }).filter('eventsByEntireShift', function(DateHolder){
        return function(events,shift){
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
                if(isStartingAtShift || isEndingWithinShift){
                    filteredEventsArr.push(event);
                }
            });

            return filteredEventsArr;
        }
    })

