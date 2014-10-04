var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices

    .service('ShiftsDayHolder', function (ShiftsDayGenerator, $q, $rootScope, DateHolder, AllDayShift, DateHelpers) {
        var self = this;

        function ShiftsDayHolderException(message) {
            this.name = 'ShiftsDayHolderException';
            this.message= message;
        }
        ShiftsDayHolderException.prototype = new Error();
        ShiftsDayHolderException.prototype.constructor = ShiftsDayHolderException;


        this.$checkIfEventFitsShifts = function (event) {
            var theDateShifts = ShiftsDayGenerator(event.data.startTime),
                defer = $q.defer();
            if (theDateShifts.isContainingEvent(event)) {
                defer.resolve(true);
            } else {
                var theDayBefore = event.data.startTime.clone().subtract(1, 'days');
                theDateShifts = ShiftsDayGenerator(theDayBefore);
                if (theDateShifts.isContainingEvent(event)) {
                    defer.resolve(true);
                } else {
                    defer.resolve(false);
                }
            }
            return defer.promise;
        };


        this.$selectNewShift = function(shift){
            self.selectedShift = shift;
            console.log('$selectNewShift',shift);
            DateHolder.currentClock = DateHelpers.isMomentValid(shift.defaultTime) ? shift.defaultTime.clone() : (DateHelpers.isMomentValid(shift.startTime) ? shift.startTime.clone() : null)
        }


        var loadShiftWithDate = function(date, initByDateChange){
            if(!DateHelpers.isMomentValid(date)){
                throw new ShiftsDayHolderException('Load shift with date was failed. Please provide a valid moment object');
            }
            var wasInitialized = !!self.currentDay;
            if(!wasInitialized) initByDateChange = false;
            var _shiftDay = ShiftsDayGenerator(date);
            validateShiftsWithDate(_shiftDay, date);
            self.currentDay = _shiftDay;
            if(initByDateChange && DateHolder.currentClock){
                self.selectedShift = getDefaultShiftForClock(_shiftDay);
            }else{
                self.selectedShift = getDefaultShiftForDay(_shiftDay);
                selectDefaultTime();
            }
        };


        var validateShiftsWithDate = function(_shiftDay, date){
            var currentShift;
            for (var i = 0; i < _shiftDay.shifts.length; ++i){
                currentShift = _shiftDay.shifts[i];
                currentShift.startTime.date(date.date()).month(date.month()).year(date.year());
            }
        }

        var getDefaultShiftForDay = function(_shiftDay){
            var currentShift, endTime;
            for (var i = 0; i < _shiftDay.shifts.length - 1; ++i){
                currentShift = _shiftDay.shifts[i];
                endTime =  currentShift.startTime.clone().add(currentShift.duration, 'minutes');
                var startTimeCheck = DateHolder.currentClock.diff(currentShift.startTime, 'minutes');
                var endTimeCheck = DateHolder.currentClock.diff(endTime, 'minutes');
                if(startTimeCheck >= 0 && endTimeCheck <= 0){
                    return currentShift;
                }
            }

            return _shiftDay.shifts[0];
        };

        var getDefaultShiftForClock = function(_shiftDay){
            var currentShift, endTime;
            for (var i = 0; i < _shiftDay.shifts.length - 1; ++i){
                currentShift = _shiftDay.shifts[i];
                endTime =  currentShift.startTime.clone().add(currentShift.duration, 'minutes');
                var startTimeCheck = DateHolder.currentClock.diff(currentShift.startTime, 'minutes');
                var endTimeCheck = DateHolder.currentClock.diff(endTime, 'minutes');
                if(startTimeCheck >= 0 && endTimeCheck <= 0){
                    return currentShift;
                }
            }
            return AllDayShift();
        };

        var selectDefaultTime = function(){
            var defaultTime = self.selectedShift && self.selectedShift.defaultTime;
            if(DateHelpers.isMomentValid(defaultTime)){
                DateHolder.currentClock = defaultTime.clone();
            }
        };

        $rootScope.$on('$dateWasChanged', function(){
            loadShiftWithDate(DateHolder.currentDate, true);
        });



    })