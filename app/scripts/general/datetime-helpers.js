var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .constant('EventInterval',15)
    .constant('FullDateFormat',"YYYY-MM-DD HH:mm:ss")
    .constant('DateFormatFirebase',"YYYY-MM-DD")
    .constant('HourFormatFirebase',"HH:mm")
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
            if(!date || !date.isValid || !date.isValid()) return date;
            var minutes = date.minute();
            return parseInt(minutes/EventInterval) * EventInterval;
        }


        var resetDateSeconds = function(date){
            var dateMoment = moment(date);
            dateMoment.set('seconds',0);
            return new Date(dateMoment.format(FullDateFormat));
        }

        var isMomentValid = function(m){
            return m && m.isValid && m.isValid();
        }

        var isMomentSameDate = function(m1,m2){
            if(isMomentValid(m1) && isMomentValid(m2)){
                return (m1.year() == m2.year() && m1.month() == m2.month() && m1.date() == m2.date());
            }
            return false;
        }



        return {
            changeDateHourAndMinutes : changeDateHourAndMinutes,
            hourAndMinutesArrFromString : hourAndMinutesArrFromString,
            findClosestIntervalToDate : findClosestIntervalToDate,
            resetDateSeconds : resetDateSeconds,
            isMomentValid : isMomentValid,
            isMomentSameDate : isMomentSameDate
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
    }).factory('$localeDurations', [function () {
        return {
            'one': {
                year: '{} שנה',
                month: '{} חודש',
                week: '{} שבוע',
                day: '{} יום',
                hour: '{} שעה',
                minute: '{} דקה',
                second: '{} שנייה'
            },
            'other': {
                year: '{} שנים',
                month: '{} חודשים',
                week: '{} שבועות',
                day: '{} ימים',
                hour: '{} שעות',
                minute: '{} דקות',
                second: '{} שניות'
            }
        };
    }])

    .filter('duration', ['$locale', '$localeDurations', function ($locale, $localeDurations) {
        return function duration(value, unit, precision) {

            var unitNames = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'],
                units = {
                    year: 86400*365.25,
                    month: 86400*31,
                    week: 86400*7,
                    day: 86400,
                    hour: 3600,
                    minute: 60,
                    second: 1
                },
                words = [],
                maxUnits = unitNames.length;


            precision = parseInt(precision, 10) || units[precision || 'second'] || 1;
            value = (parseInt(value, 10) || 0) * (units[unit || 'second'] || 1);

            if (value >= precision) {
                value = Math.round(value / precision) * precision;
            } else {
                maxUnits = 1;
            }

            var i, n;
            for (i = 0, n = unitNames.length; i < n && value !== 0; i++) {

                var unitName = unitNames[i],
                    unitValue = Math.floor(value / units[unitName]);

                if (unitValue !== 0) {
                    words.push(($localeDurations[unitValue] || $localeDurations[$locale.pluralCat(unitValue)] || {unitName: ('{} ' + unitName)})[unitName].replace('{}', unitValue));
                    if (--maxUnits === 0) {
                        break;
                    }
                }

                value = value % units[unitName];
            }

            return words.join(' ');
        };
    }]).filter('dayOfWeekFilter', function(){
        return function(input){
            if(input != 0 && !input) return;
            var days = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
            return days[input];
        }
    }).filter('momentFilter', function(DateHelpers){
        return function(input, format){
            if(!DateHelpers.isMomentValid(input) ) return;
            return input.format(format) + "";
        }
    }).value('HourRegex', {
        pattern : /^([01]\d|2[0-3]):?([0-5]\d)$/
    });
