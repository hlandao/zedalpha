var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('ShiftsWeek', function (EditableShiftsDay, BasicShiftsDayGenerator, $q) {
        function ShiftsWeek(weekNumber) {
            this.days = [];
            if (weekNumber != 'basic') {
                var dateMoment = moment().week(weekNumber).day(0).seconds(0);
                for (var i = 0; i < 7; ++i) {
                    this.days.push(EditableShiftsDay.byDate(dateMoment));
                    dateMoment.add('days', 1);
                }

            } else {
                for (var i = 0; i < 7; ++i) {
                    this.days.push(BasicShiftsDayGenerator.byDate(i));
                }
            }

            return this;
        }
        return ShiftsWeek;
    });