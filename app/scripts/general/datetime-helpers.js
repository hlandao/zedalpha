var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .constant('EventInterval',15)
    .constant('FullDateFormat',"YYYY-MM-DD HH:mm:ss")
    .factory('DateHelpers', function(FullDateFormat, EventInterval){

        /**
         * return new date with the hour and minutes spefified via either hourAndMinuteStr OR hour/minute
         * @param date: the original date
         * @param hourAndMinuteStr: "HH:mm"
         * @param hour: the hour
         * @param minute the minute
         * @returns {Date}
         */
        var changeDateHourAndMinutes = function(date, hourAndMinuteStr, hour, minute){
            if(hourAndMinuteStr){
               var splitArr =  hourAndMinutesArrFromString(hourAndMinuteStr);
                hour = splitArr.hour;
                minute = splitArr.minute;
            }
            var dateMoment = moment(date);
            if(hour >= 0){
                dateMoment.hour(hour);
            }

            if(minute >= 0){
                dateMoment.minute(minute);
            }

            return new Date(dateMoment.format(FullDateFormat));
        };


        /**
         *
         * @param hourAndMinuteStr - "HH:mm"
         * @returns {null, {hour : XX, minute : XX}}
         */
        var hourAndMinutesArrFromString = function(hourAndMinuteStr){
            if (!hourAndMinuteStr || !~hourAndMinuteStr.indexOf(':')) {
                return null;
            }
            var arr = hourAndMinuteStr.split(':');
            if (arr.length) {
                return {
                    hour: arr[0],
                    minute: arr[1]
                };
            } else {
                return null;
            }
        };

        var findClosestIntervalToDate = function(date){
            if(!date) return false;
            date = new Date(date);
            var minutes = moment(date).minute();
            return parseInt(minutes/EventInterval) * EventInterval;
        }


        var resetDateSeconds = function(date){
            var dateMoment = moment(date);
            dateMoment.set('seconds',0);
            return new Date(dateMoment.format(FullDateFormat));
        }


        return {
            changeDateHourAndMinutes : changeDateHourAndMinutes,
            hourAndMinutesArrFromString : hourAndMinutesArrFromString,
            findClosestIntervalToDate : findClosestIntervalToDate,
            resetDateSeconds : resetDateSeconds
        };
    })
    .filter('numberFixedLen', function () {
        return function (n, len) {
            var num = parseInt(n, 10);
            len = parseInt(len, 10);
            if (isNaN(num) || isNaN(len)) {
                return n;
            }
            num = ''+num;
            while (num.length < len) {
                num = '0'+num;
            }
            return num;
        };
    });
