var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('ShiftsWeek', function (EditableShiftsDay, BasicShiftsDayGenerator) {
        function ShiftsWeek(weekNumber) {
            var self = this;
            this.days = [];
            if (weekNumber != 'basic') {
                var dateMoment = moment().week(weekNumber).day(0).seconds(0);
                for (var i = 0; i < 7; ++i) {
                    this.days.push(new EditableShiftsDay(dateMoment));
                    dateMoment.add('days', 1);
                }

            } else {
                for (var i = 0; i < 7; ++i) {
                    BasicShiftsDayGenerator.byDayOfWeek(i).then(function(_day){
                        self.days.push(_day);
                    });

                }
            }

            return this;
        }
        return ShiftsWeek;
    });