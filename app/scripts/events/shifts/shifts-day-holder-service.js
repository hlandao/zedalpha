var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('ShiftsDayHolder', function($rootScope, DateHolder, BusinessHolder, BasicShift, ShiftDay, FullDateFormat,AllDayShift, $q){
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

            _shift.selected = AllDayShift();
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
            console.log('newVal',newVal);
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
            console.log('newVal.defaultTime',newVal.defaultTime);
            DateHolder.current = new Date(newVal.defaultTime || newVal.startTime);
            console.log('DateHolder.current',DateHolder.current);

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
            _shift.fetchShiftWithDateFromDB(date).then(function(_shiftResponse){
                _shift.current = _shiftResponse;
                selectDefaultShiftForShiftDay(_shift.current);
                console.log('_shift.current',_shift.current);
            });
        }

        _shift.fetchShiftWithDateFromDB = function(date){
            var defer = $q.defer();
            $shiftsDays = $shiftsDays || BusinessHolder.$business.$child('shifts').$child('days');
            var dateMoment = moment(date);
            console.log('dateMoment',dateMoment);
            if(dateMoment){
                var dayOfYear = dateMoment.dayOfYear();
                $shiftsDays.$child(''+dayOfYear+'').$getRef().once('value', function(snapshot){
                    var val = snapshot.val();
                    if(val){
                        defer.resolve(new ShiftDay(null, val));
                    }else{
                        defer.resolve(BasicShift.basicShiftForDayOfWeek(date));
                    }
                });

            }
            return defer.promise;
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

