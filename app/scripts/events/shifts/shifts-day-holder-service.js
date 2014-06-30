var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('ShiftsDayHolder', function($rootScope, DateHolder, BusinessHolder, BasicShift, ShiftDay, FullDateFormat){
        var _shift = {};
        var $shiftsDays,
            $currentDay;

        var selectDefaultShiftForShiftDay = function(_shiftDay){
            var now = moment(), currentShift, startDateMoment, endDateMoment;
            for (var i = 0; i < _shiftDay.shifts.length; ++i){
                currentShift = _shiftDay.shifts[i];
                startDateMoment = moment(currentShift.startTime);
                endDateMoment = moment(currentShift.endTime);
                if(now >= startDateMoment && now <= endDateMoment){
                    return _shift.selected = currentShift;
                }
            }
            var l =_shiftDay.shifts.length;
            if(l) _shift.selected = _shiftDay.shifts[l-1];
        };

        var selectDefaultTimeForShift = function(shift){
            if(shift.defaultTime){
                var currentMoment = moment(DateHolder.current);
                var defaultTomeMoment = moment(shift.defaultTime);
                currentMoment.hour(defaultTomeMoment.hour()).minute(defaultTomeMoment.minute());
                DateHolder.current = new Date(currentMoment.format(FullDateFormat));
            }
        };

        $rootScope.$watch(function(){
            return DateHolder.current;
        }, function(newVal, oldVal){
            // fetch current day shifts from server or use the basic shift
            // ONLY if the *date* was changed;
            // AND if the date is the next day only and the new *hour* is later than the current latest shift ending time
            var newValMoment = moment(newVal),
                newDayOfYear = newValMoment.dayOfYear(),
                oldValMoment = moment(oldVal),
                oldDayOfYear = oldValMoment.dayOfYear();


            if(!_shift.current || (newDayOfYear != oldDayOfYear && (Math.abs(oldDayOfYear - oldDayOfYear) > 1 || checkIfMomentTimeIsLaterThanCurrentEndingTime(newValMoment))))
                fetchShiftWithDate(newVal);
        });

        var checkIfMomentTimeIsLaterThanCurrentEndingTime = function(dateMoment){
            var latestEndingTimeMoment, thisEndingTimeMoment;
            if (!_shift.current) return true;
            for(var i = 0; i < _shift.current.shifts.length; ++i){
                if(!latestEndingTimeMoment){
                    latestEndingTimeMoment = moment(_shift.current.shifts[i].endTime);
                    continue;
                }
                thisEndingTimeMoment = moment(_shift.current.shifts[i].endTime);
                latestEndingTimeMoment = (latestEndingTimeMoment >= thisEndingTimeMoment) ? thisEndingTimeMoment : thisEndingTimeMoment;
            }

            return (dateMoment > latestEndingTimeMoment);
        };

        var fetchShiftWithDate = function(date){
            $shiftsDays = $shiftsDays || BusinessHolder.$business.$child('shifts').$child('days');
            var dateMoment = moment(date);
            if(dateMoment){
                var dayOfYear = dateMoment.dayOfYear();

                $shiftsDays.$child(''+dayOfYear+'').$getRef().once('value', function(snapshot){
                    var val = snapshot.val();
                    if(val){
                        _shift.current = new ShiftDay(null, val);
                    }else{
                        _shift.current = BasicShift.basicShiftForDayOfWeek(date);
                    }
                    selectDefaultShiftForShiftDay(_shift.current);
                });

            }
        }

        return _shift;
    }).factory('BasicShift', function($rootScope, BusinessHolder, BasicShiftDay){
        var $basic = BusinessHolder.$business.$child('shifts').$child('basic');

        $rootScope.$on('$businessHolderChanged', function(){
            $basic = BusinessHolder.$business.$child('shifts').$child('basic');
        });

        return {
            basicShiftForDayOfWeek : function(date){
                var dayOfWeek = moment(date).day();
                return new BasicShiftDay(null, $basic[dayOfWeek], date);
            }
        }
    });