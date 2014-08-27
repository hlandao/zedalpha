var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('ShiftsDayHolder', function($rootScope, DateHolder, BusinessHolder, BasicShift, ShiftDay, FullDateFormat,AllDayShift, $q, $log){
        var _shift = {};
        var $shiftsDays;

        var selectDefaultShiftForShiftDay = function(_shiftDay){
            var now = moment(), currentShift, startDateMoment, endDateMoment;
            if(keepClockAfterChangingDate){
                now = moment(DateHolder.currentClock);
            }
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


        var keepClockAfterChangingDate = false;
        $rootScope.$watch(function(){
            return DateHolder.currentDate;
        }, function(newVal, oldVal){
            // fetch current day shifts from server or use the basic shift
            // ONLY if the *date* was changed;
            // AND if the date is the next day only and the new *hour* is later than the current latest shift ending time

            $log.info('[ShiftsDayHolder] currentDate was changed to ', moment(newVal).format(FullDateFormat));
            var newValMoment = moment(newVal),
                newDayOfYear = newValMoment.dayOfYear(),
                oldValMoment = moment(oldVal),
                oldDayOfYear = oldValMoment.dayOfYear(),
                currentClockMoment = moment(DateHolder.currentClock);

            if(currentClockMoment){
                keepClockAfterChangingDate = true;
                DateHolder.currentClock = new Date(newValMoment.hour(currentClockMoment.hour()).minutes(currentClockMoment.minutes()).seconds(0).format(FullDateFormat));
                $log.info('[ShiftsDayHolder] changing currentClock  to ', moment(DateHolder.currentClock).format(FullDateFormat));
            }else{
                $log.info('[ShiftsDayHolder] changing currentClock  to ', moment(newVal).format(FullDateFormat));
                DateHolder.currentClock = new Date(newVal);
            }


            if(!_shift.current || (newDayOfYear != oldDayOfYear &&  ((newDayOfYear-oldDayOfYear) != 1 || checkIfMomentTimeIsLaterThanCurrentEndingTime(newValMoment)))){
                fetchShiftWithDate(newVal);
            }

        });




        $rootScope.$watch(function(){
            return _shift.selected;
        },function(newVal){
            if(newVal && !keepClockAfterChangingDate){
                console.log('here : ',newVal);
                DateHolder.currentClock = new Date(newVal.defaultTime || newVal.startTime);
                $log.info('[ShiftsDayHolder] changing currentClock after _shift.selected change to ', moment(DateHolder.currentClock).format(FullDateFormat));

            }else{
                keepClockAfterChangingDate = false;
            }

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
                console.log('_shiftResponse',_shiftResponse);
                _shift.current = _shiftResponse;
                selectDefaultShiftForShiftDay(_shift.current);
            });
        }

        _shift.fetchShiftWithDateFromDB = function(date){
            var defer = $q.defer();

            if(!BusinessHolder.$business){
                defer.reject();
                return defer.promise;
            }
            $shiftsDays = $shiftsDays || BusinessHolder.$business.$child('shifts').$child('days');
            var dateMoment = moment(date);
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
        var $basic;

        var update = function(){
            $basic = BusinessHolder.$business.$child('shifts').$child('basic');
        }

        $rootScope.$on('$businessHolderChanged', update);

        if(BusinessHolder.$business) update();

        return {
            basicShiftForDayOfWeek : function(date){
                var dayOfWeek = moment(date).day();
                console.log('date',date,'dayOfWeek',dayOfWeek,'$basic[dayOfWeek]',$basic[dayOfWeek]);
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

            if(DateHolder.currentDate){
                dateMoment = moment(DateHolder.currentDate);
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

