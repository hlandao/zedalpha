var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices

    .constant('FullDateFormat',"YYYY-MM-DD HH:mm:ss")
    .factory('DateHelpers', function(FullDateFormat){

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
            if(hour){
                dateMoment.hour(hour);
            }

            if(minute){
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


        return {
            changeDateHourAndMinutes : changeDateHourAndMinutes,
            hourAndMinutesArrFromString : hourAndMinutesArrFromString
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
