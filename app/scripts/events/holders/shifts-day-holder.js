var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices

    .service('ShiftsDayHolder', function (ShiftsDayGenerator, ReadOnlyShiftsDayGenerator, $q) {

        this.$checkIfEventFitsShifts = function (event) {
            var theDateShifts = ReadOnlyShiftsDayGenerator.byDate(event.startTime),
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




        var loadShiftsWithDate = function(date){
            var wasInitialized = !!this.currentDay;
            ShiftsDayGenerator.byDate(date).then(function(_shiftDay){
               this.currentDay = _shiftDay;
                this.selectedShift = getDefaultShiftForDay(_shiftDay);
                if(!wasInitialized){
                    selectDefaultTime();
                }
            });
        };

        var getDefaultShiftForDay = function(_shiftDay){
            var currentShift;
            if(keepClockAfterChangingDate){
                now = moment(DateHolder.currentClock);
            }
            for (var i = 0; i < _shiftDay.shifts.length; ++i){
                currentShift = _shiftDay.shifts[i];
                startDateMoment = moment(currentShift.startTime);
                endDateMoment = moment(currentShift.endTime);

                var startTimeCheck = DateHolder.currentDate.isSame(currentShift.startTime) || DateHolder.currentDate.isAfter(currentShift.startTime);
                var endTimeCheck =
                if(DateHolder.currentDate >= currentShift.startTime && now <= currentShift.endTime){
                    return _shift.selected = currentShift;
                }
            }


            _shift.selected = AllDayShift();
        };

        var selectCurrentShift = function(){

        };

        var selectDefaultTime = function(){

        };

        $rootScope.$on('$dateWasChanged', function(){
            loadShiftWithDate(DateHolder.currentDate, false);
        });


        $rootScope.$watch(function(){
            return this.selectedShift;
        },function(newVal){
            if(newVal && !keepClockAfterChangingDate){
                console.log('here : ',newVal);
                DateHolder.currentClock = new Date(newVal.defaultTime || newVal.startTime);
                $log.info('[ShiftsDayHolder] changing currentClock after _shift.selected change to ', moment(DateHolder.currentClock).format(FullDateFormat));

            }else{
                keepClockAfterChangingDate = false;
            }

        });


    })