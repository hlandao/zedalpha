var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices

    .service("BasicShiftsDayGenerator", function(BusinessHolder, ShiftsDayObject,ShiftsDay, ReadOnlyShiftsDayGenerator){

    var initShift = function(shift){
        shift.startTime = moment(shift.startTime);
        shift.defaultTime = moment(shift.defaultTime);
        shift.duration = parseInt(shift.duration);
    };

    this.rawObjectByDate = function(dayOfWeek){
        var ref = BusinessHolder.business.$inst().$ref().child('shifts').child('basic').child(dayOfWeek);
        return ShiftsDayObject(ref);
    };

    this.byDate = function(dayOfWeek){
        return this.rawObjectByDate(dayOfWeek).$loaded().then(function(basicShiftsDay){
            if(!basicShiftsDay.shifts){
                var date = moment().day(dayOfWeek);
                var readOnlyShiftForDate = ReadOnlyShiftsDayGenerator.byDate(date);
                readOnlyShiftForDate.basic = true;
                readOnlyShiftForDate.date = null;
                angular.extend(basicShiftsDay,readOnlyShiftForDate);
                basicShiftsDay.$save();
//                basicShiftsDay.$inst().$set(readOnlyShiftForDate);
            }

            angular.forEach(basicShiftsDay.shifts, initShift);
            return basicShiftsDay;
        });

    };

})