var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices

    .service('ShiftsDayHolder', function (ShiftsDayGenerator, ReadOnlyShiftsDayGenerator, $q, $rootScope, DateHolder, AllDayShift) {
        var self = this;
        this.$checkIfEventFitsShifts = function (event) {
            var theDateShifts = ReadOnlyShiftsDayGenerator.byDate(event.data.startTime, true),
                defer = $q.defer();
            if (theDateShifts.isContainingEvent(event)) {
                defer.resolve(true);
            } else {
                var theDayBefore = event.startTime.clone().subtract(1, 'days');
                theDateShifts = ReadOnlyShiftsDayGenerator.byDate(theDayBefore);
                if (theDateShifts.isContainingEvent(event)) {
                    defer.resolve(true);
                } else {
                    defer.resolve(false);
                }
            }
            return defer.promise;
        };




        var loadShiftWithDate = function(date){
            var wasInitialized = !!this.currentDay;
            ShiftsDayGenerator.byDate(date).then(function(_shiftDay){
               self.currentDay = _shiftDay;
                self.selectedShift = getDefaultShiftForDay(_shiftDay);
                if(!wasInitialized){
                    selectDefaultTime();
                }
            });
        };

        var getDefaultShiftForDay = function(_shiftDay){
            var currentShift;
            for (var i = 0; i < _shiftDay.shifts.length; ++i){
                currentShift = _shiftDay.shifts[i];

                var startTimeCheck = DateHolder.currentClock.isSame(currentShift.startTime, 'minutes') || DateHolder.currentClock.isAfter(currentShift.startTime, 'minutes');
                var endTimeCheck = DateHolder.currentClock.isSame(currentShift.endTime, 'minutes') || DateHolder.currentClock.isBefore(currentShift.endTime, 'minutes') ;
                if(startTimeCheck && endTimeCheck){
                    return currentShift;
                }
            }

            return AllDayShift();
        };

        var selectDefaultTime = function(){
            var defaultTime = this.selectedShift && this.selectedShift.defaultTime;
            if(defaultTime && defaultTime.isValid && this.selectedShift.defaultTime.isValid()){
                DateHolder.currentClock = this.selectedShift.defaultTime;
            }
        };

        $rootScope.$on('$dateWasChanged', function(){
            loadShiftWithDate(DateHolder.currentDate);
        });


//        $rootScope.$watch(function(){
//            return this.selectedShift;
//        },function(newVal){
//
//            if(newVal && !keepClockAfterChangingDate){
//                console.log('here : ',newVal);
//                DateHolder.currentClock = new Date(newVal.defaultTime || newVal.startTime);
//                $log.info('[ShiftsDayHolder] changing currentClock after _shift.selected change to ', moment(DateHolder.currentClock).format(FullDateFormat));
//
//            }else{
//                keepClockAfterChangingDate = false;
//            }
//
//        });


    })