var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices

    .service('ShiftsDayHolder', function (ShiftsDayGenerator, ReadOnlyShiftsDayGenerator, $q, $rootScope, DateHolder, AllDayShift) {
        var self = this;
        this.$checkIfEventFitsShifts = function (event) {
            var theDateShifts = ReadOnlyShiftsDayGenerator.byDate(event.data.startTime, {
                    tryBasicShifts : true,
                    extendProto : true
                }),
                defer = $q.defer();
            if (theDateShifts.isContainingEvent(event)) {
                defer.resolve(true);
            } else {
                var theDayBefore = event.data.startTime.clone().subtract(1, 'days');
                theDateShifts = ReadOnlyShiftsDayGenerator.byDate(theDayBefore, {
                    tryBasicShifts : true,
                    extendProto : true
                });
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
            DateHolder.currentClock = shift.defaultTime || shift.startTime;
        }


        var loadShiftWithDate = function(date){
            var wasInitialized = !!this.currentDay;
            var _shiftDay = ReadOnlyShiftsDayGenerator.byDate(date, {
                tryBasicShifts : true,
                extendProto : true
            });
            validateShiftsWithDate(_shiftDay, date);
            self.currentDay = _shiftDay;
            self.selectedShift = getDefaultShiftForDay(_shiftDay);
            if(!wasInitialized){
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

            return _shiftDay.shifts[_shiftDay.shifts.length-1];
            return AllDayShift();
        };

        var selectDefaultTime = function(){
            var defaultTime = self.selectedShift && self.selectedShift.defaultTime;
            if(!defaultTime) defaultTime = self.selectedShift && self.selectedShift.startTime;
            if(defaultTime && defaultTime.isValid && defaultTime.isValid()){
                DateHolder.currentClock = defaultTime;
            }
        };

        $rootScope.$on('$dateWasChanged', function(){
            loadShiftWithDate(DateHolder.currentDate);
        });



    })