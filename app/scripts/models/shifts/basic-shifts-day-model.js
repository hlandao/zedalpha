var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices

    .service("BasicShiftsDayGenerator", function(BusinessHolder, ShiftsDayObject,ShiftsDay, ReadOnlyShiftsDayGenerator){

    var initShift = function(shift){
        console.log('shift',shift);
        shift.startTime = moment(shift.startTime);
        shift.defaultTime = moment(shift.defaultTime);
        shift.duration = parseInt(shift.duration);
    };

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

            angular.forEach(basicShiftsDay.shifts, initShift);

            return basicShiftsDay;
        });

    };

})