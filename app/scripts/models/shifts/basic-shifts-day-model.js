var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices

    .service("BasicShiftsDayGenerator", function(BusinessHolder, ShiftsDayObject,ShiftsDay, ReadOnlyShiftsDayGenerator){

    this.rawObjectByDate = function(dayOfWeek){
        var ref = BusinessHolder.business.$inst().$ref().child('shifts/basic').child(dayOfWeek);
        return ShiftsDayObject(ref);
    };

    this.byDate = function(dayOfWeek){
        return this.rawObjectByDate(dayOfWeek).$loaded().then(function(basicShiftsDay){
            if(!basicShiftsDay.shifts){
                var readOnlyShiftForDate = ReadOnlyShiftsDayGenerator.shiftsDayByDate(date);
                readOnlyShiftForDate.basic = true;
                readOnlyShiftForDate.date = null;
                basicShiftsDay.$inst().$set(readOnlyShiftForDate);
            }

            return basicShiftsDay;
        });

    };

})