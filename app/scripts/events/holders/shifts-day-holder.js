var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices

    .service('ShiftsDayHolder', function (ShiftsDayGenerator, $q, $rootScope, AllDayShift, DateHelpers,DateFormatFirebase, $log) {
        var self = this;

        function ShiftsDayHolderException(message) {
            this.name = 'ShiftsDayHolderException';
            this.message= message;
        }
        ShiftsDayHolderException.prototype = new Error();
        ShiftsDayHolderException.prototype.constructor = ShiftsDayHolderException;


        /**
         * Init shif
         * @param date
         * @param initByDateChange
         */
        this.loadWithDate = function(date, options){
            var defaultShift, tempShiftDay;
            options = angular.extend({
                selectShiftByClock : false,
                clock : null
            }, options);

            if(!DateHelpers.isMomentValid(date)){
                throw new ShiftsDayHolderException('Load shift with date was failed. Please provide a valid moment object');
            }

            debugger;
            $log.debug('[ShiftsDayHolder] load with date : ', date.format(DateFormatFirebase));

            tempShiftDay = ShiftsDayGenerator(date);

            validateShiftsWithDate(tempShiftDay, date);
            self.currentDay = tempShiftDay;

            if(options.selectShiftByClock && options.clock){
                defaultShift = getDefaultShiftForDayByClock(self.currentDay, options.clock);
            }

            if(defaultShift){
                self.selectedShift = defaultShift;
            }else{
                self.selectedShift = AllDayShift(self.currentDay);
            }
        };



        /**
         * Validate shiftDay date compared to another date
         * @param _shiftDay
         * @param date
         */
        var validateShiftsWithDate = function(_shiftDay, date){
            var currentShift;
            for (var i = 0; i < _shiftDay.shifts.length; ++i){
                currentShift = _shiftDay.shifts[i];
                if(!DateHelpers.areMomentsHaveSameDates(date,currentShift.startTime)){
                    throw new ShiftsDayHolderException('Invalid shiftDay date. ShiftDay : ',_shiftDay , '. Date : ',date);
                }
            }
        }


        /**
         * Select the default shift by finding the shift that contains the current clock of the system.
         * @param shiftDay
         * @param clock
         * @returns {*}
         */
        var getDefaultShiftForDayByClock = function(shiftDay, clock){
            if(!DateHelpers.isMomentValid(clock)){
                throw new ShiftsDayHolderException('Please provide a valid Moment object to getDefaultShiftForDayByClock');
            }

            var currentShift, endTime;
            var shifts = shiftDay.activeShifts();
            for (var i = 0; i < shifts.length; ++i){
                currentShift = shifts[i];
                endTime =  currentShift.startTime.clone().add(currentShift.duration, 'minutes');
                var startTimeCheck = clock.diff(currentShift.startTime, 'minutes');
                var endTimeCheck = clock.diff(endTime, 'minutes');
                if(startTimeCheck >= 0 && endTimeCheck <= 0){
                    return currentShift;
                }
            }

            return null;
        };

        /**
         * HELPER, check if a given event is within the current day
         * @param event
         * @returns {*}
         */
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
    });