var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices

    .service('ShiftsDayHolder', function (ShiftsDayGenerator, $q, $rootScope, DateHolder, AllDayShift, DateHelpers,DateFormatFirebase, $log) {
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
            $log.info('[ShiftsDayHolder] User selected new shift : ', shift.name);
            DateHolder.currentClock = DateHelpers.isMomentValid(shift.defaultTime) ? shift.defaultTime.clone() : (DateHelpers.isMomentValid(shift.startTime) ? shift.startTime.clone() : null)
        }


        var loadShiftWithDate = function(date, initByDateChange){
            if(!DateHelpers.isMomentValid(date)){
                throw new ShiftsDayHolderException('Load shift with date was failed. Please provide a valid moment object');
            }

            $log.info('[ShiftsDayHolder] load with date : ', date.format(DateFormatFirebase) +
                ' , init with a date change : ' + initByDateChange);

            var wasInitialized = !!self.currentDay;

            var _shiftDay = ShiftsDayGenerator(date);

            validateShiftsWithDate(_shiftDay, date);
            self.currentDay = _shiftDay;

            if(initByDateChange && DateHolder.currentClock && wasInitialized) {
                self.selectedShift = getDefaultShiftForDay(_shiftDay);
                if(!self.selectedShift){
                    self.selectedShift = AllDayShift(_shiftDay);
                }
            } else if (initByDateChange && DateHolder.currentClock && !wasInitialized){
                self.selectedShift = getDefaultShiftForDay(_shiftDay);
                if(!self.selectedShift){
                    self.selectedShift = AllDayShift(_shiftDay);
                }
                if(self.selectedShift.name !== 'ENTIRE_DAY'){
                    selectDefaultTime();
                }

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


        /**
         * Select the default shift by finding the shift that contains the current clock of the system.
         * @param _shiftDay
         * @returns {*}
         */
        var getDefaultShiftForDay = function(_shiftDay){
            var currentShift, endTime;
            var shifts = _shiftDay.activeShifts();
            for (var i = 0; i < shifts.length; ++i){
                currentShift = shifts[i];
                endTime =  currentShift.startTime.clone().add(currentShift.duration, 'minutes');
                var startTimeCheck = DateHolder.currentClock.diff(currentShift.startTime, 'minutes');
                var endTimeCheck = DateHolder.currentClock.diff(endTime, 'minutes');
                if(startTimeCheck >= 0 && endTimeCheck <= 0){
                    return currentShift;
                }
            }

            return null;
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