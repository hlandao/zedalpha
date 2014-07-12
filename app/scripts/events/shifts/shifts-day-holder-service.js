var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('ShiftsDayHolder', function($rootScope, DateHolder, BusinessHolder, BasicShift, ShiftDay, FullDateFormat){
        var _shift = {};
        var $shiftsDays;

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
            if(isShiftJustChanged){
                return isShiftJustChanged = false;
            }
            isDateHolderJustChanged = true;

            var newValMoment = moment(newVal),
                newDayOfYear = newValMoment.dayOfYear(),
                oldValMoment = moment(oldVal),
                oldDayOfYear = oldValMoment.dayOfYear();
            if(!_shift.current || (newDayOfYear != oldDayOfYear &&  ((newDayOfYear-oldDayOfYear) != 1 || checkIfMomentTimeIsLaterThanCurrentEndingTime(newValMoment)))){
                fetchShiftWithDate(newVal);
            }else{
                isDateHolderJustChanged=false;
            }

        });

        var  isShiftJustChanged = false, isDateHolderJustChanged = false;
        $rootScope.$watch(function(){
            return _shift.selected;
        },function(newVal){
            if(isDateHolderJustChanged){
                isDateHolderJustChanged = false;
                return;
            }
            isShiftJustChanged = true;

            DateHolder.current = new Date(newVal.defaultTime || newVal.startTime);

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
                latestEndingTimeMoment = (latestEndingTimeMoment >= thisEndingTimeMoment) ? latestEndingTimeMoment : thisEndingTimeMoment;
            }

            return (dateMoment > latestEndingTimeMoment);
        };

        var fetchShiftWithDate = function(date){
            $shiftsDays = $shiftsDays || BusinessHolder.$business.$child('shifts').$child('days');
            var dateMoment = moment(date);
            if(dateMoment){
                var dayOfYear = dateMoment.dayOfYear();
                console.log('dayOfYear',dayOfYear);
                $shiftsDays.$child(''+dayOfYear+'').$getRef().once('value', function(snapshot){
                    var val = snapshot.val();
                    if(val){
                        console.log(1);
                        _shift.current = new ShiftDay(null, val);
                    }else{
                        console.log(2);
                        _shift.current = BasicShift.basicShiftForDayOfWeek(date);
                    }
                    console.log('_shift.current',_shift.current);
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
                var output = new BasicShiftDay(null, $basic[dayOfWeek], date);
                return output;
            }
        }
    }).factory('AllDayShift', function(DateHolder,FullDateFormat){
        var defaults = {
            active : true,
            name : "ENTIRE_DAY"
        }
        return function(){
            var dateMoment;

            if(DateHolder.current){
                dateMoment = moment(DateHolder.current);
            }else{
                dateMoment = moment();
            }

            var defaultTime = new Date(dateMoment.format(FullDateFormat));
            var startTime = new Date(dateMoment.hour(0).minutes(0).seconds(0).format(FullDateFormat));
            var endTime = new Date(dateMoment.hour(23).minutes(59).seconds(0).format(FullDateFormat));


            return angular.extend(defaults, {
                startTime : startTime,
                endTime : endTime,
                defaultTime : defaultTime
            })
        }
    });

