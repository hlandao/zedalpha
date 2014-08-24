var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('ShiftsDayDefaults', function(){
        return [
            {
                name : "morning",
                defaultStartTime : moment().hour(8).minute(0).seconds(0),
                defaultDuration : 4 * 60
            },
            {
                name : "noon",
                defaultStartTime : moment().hour(12).minute(0).seconds(0),
                defaultEndTime : 4 * 60
            },
            {
                name : "evening",
                defaultStartTime : moment().hour(18).minute(0).seconds(0),
                defaultEndTime : 4 * 60
            }
        ]
    })
    .factory('ShiftsDayPrototypeHelpers', function(){
        return {
            isContainingEvent : function(event){
                for (var i = 0 ; i < this.shifts.length; ++i){
                    if(this.isEventWithinShift(this.shifts[i], event)){
                        return true;
                    }
                }
                return false;
            },
            isEventWithinShift : function(shift, event){
                var isOverlappingShift = event.startTime.isBefore(shift.startTime, 'minutes') && event.startTime.isAfter(shift.startTime, 'minutes'),
                    isStartingWithinShift = event.startTime.isSame(shift.startTime, 'minutes') || (event.startTime.isAfter(shift.startTime, 'minutes') && (event.startTime.isBefore(shift.endTime, 'minutes') || event.startTime.isSame(shift.endTime, 'minutes')));

                return isOverlappingShift || isStartingWithinShift;
            }
        }
    })
    .factory('ShiftsDay', function($FirebaseObject, ShiftsDayPrototypeHelpers){


        var initShift = function(shift){
            shift.startTime = moment(shift.startTime);
            shift.defaultTime = moment(shift.defaultTime);
            shift.duration = parseInt(shift.duration);
        };

        function ShiftsDay(firebase, destroyFunction, readyPromise){
            $FirebaseObject.call(this, firebase, destroyFunction, readyPromise);
            this.$init();
            angular.extend(this, ShiftsDayPrototypeHelpers)
        };

        ShiftsDay.prototype.$init = function(){
            this.date = moment(this.date);
            angular.forEach(this.shifts, initShift);
        };

        ShiftsDay.prototype.$saveWithValidation = function(){
            var self = this;
            return self.$beforeSave(function(){
                self.$save();
            })
        };

        ShiftsDay.prototype.$beforeSave = function(){
            return this.$validateDate().then($validateShifts);
        };

        ShiftsDay.prototype.$validateDate = function(){
            var defer = $q.defer();
            if (!this.basic && (!this.date || !this.date.isValid || !this.date.isValid()) ) {
                defer.reject({error: "ERROR_DAY_SHIFTS_INVALID_DATE"});
            } else {
                defer.resolve();
            }
            return defer.promise;
        };

        ShiftsDay.prototype.$validateShifts = function(){
            var defer = $q.defer();

            if(!this.shifts || !this.shifts.length){
                rejected = true;
                defer.reject({error : "ERROR_DAY_SHIFTS_INVALID_SHIFTS"})
            }else{
                var currentShift, rejected = false;
                for (var i = 0;i < this.shifts.length; ++i){
                    currentShift = this.shifts[i];
                    if(!shift.startTime){
                        defer.reject({error : "ERROR_DAY_SHIFTS_INVALID_SHIFTS_NO_START_TIME"})
                        rejected = true;
                        break;
                    }else if(!shift.name){
                        defer.reject({error : "ERROR_DAY_SHIFTS_INVALID_SHIFTS_NO_NAME"})
                        rejected = true;
                        break;
                    }
                }
            }

            if(!rejected) defer.resolve();

            return defer.promise;
        }

        return ShiftsDay;
    })
    .factory("ShiftsDayFactory",function ($FirebaseObject, ShiftsDay) {
        return $FirebaseObject.$extendFactory(ShiftsDay);
    }).factory("ShiftsDayObject",function ($firebase, ShiftsDayFactory) {
        return function (ref) {
            return $firebase(ref, {objectFactory: ShiftsDayFactory}).$asObject();
        }
    }).service("ShiftsDayGenerator", function(BusinessHolder, ShiftsDayObject,ShiftsDay, ReadOnlyShiftsDayGenerator){


        this.rawObjectByDate = function(date){
            var dayOfYear = date.dayOfYear();
            var ref = BusinessHolder.business.$inst().$ref().child('shifts').child(dayOfYear);
            return ShiftsDayObject(ref);
        };

        this.byDate = function(date, shiftsData){
            return this.rawObjectByDate(date).$loaded().then(function(shiftsDay){
               if(shiftsData){
                   shiftsDay.$inst().$set(shiftsData);
               }else{
                   if(!shiftsDay.shifts){
                       var readOnlyShiftForDate = ReadOnlyShiftsDayGenerator.byDate(date);
                       shiftsDay.$inst().$set(readOnlyShiftForDate);
                   }
               }
                return shiftsDay;
            });

        };

    }).service('ReadOnlyShiftsDayGenerator', function(BusinessHolder, ShiftsDayDefaults, ShiftsDayPrototypeHelpers){
        function ReadOnlyShiftsDayGenerator(){

        };

        var basicShiftsDayForDate = function(basicShiftsDay, date){
            var cloned = angular.extend({}, basicShiftsDay);
            cloned.date = date.clone();
            cloned.basic = false;
            angular.forEach(cloned.shifts, function(shift){
                shift.startTime = moment(shift.startTime).dayOfYear(date.dayOfYear());
            });
            return cloned;
        }

        var defaultShiftsDayForDate = function(date){
            var shiftsDay = {
                date : date.clone(),
                basic : false,
                active : true,
                shifts : []
            };

            angular.forEach(ShiftsDayDefaults, function(defaultShift){
                shiftsDay.shifts.push({
                    name : defaultShift.name,
                    startTime : date.clone().hour(defaultShift.defaultStartTime.hour()).minute(defaultShift.defaultStartTime.minute()),
                    duration : defaultShift.defaultDuration,
                    active : true
                });
            });

            return shiftsDay;
        }

        this.byDate = function(date){
            var dayOfYear = date.dayOfYear(),
                dayOfWeek,
                dayShifts;

            if(BusinessHolder.business.shifts[dayOfYear]){
                dayShifts = BusinessHolder.business.shifts[dayOfYear];
            }else{
                dayOfWeek = date.day();
                if(BusinessHolder.business.shifts.basic[dayOfWeek]){
                    dayShifts = basicShiftsDayForDate(BusinessHolder.business.shifts.basic[dayOfWeek], date);
                }else{
                    dayShifts = defaultShiftsDayForDate(date);
                }
            }

            angular.extend(dayShifts, ShiftsDayPrototypeHelpers);
            return dayShifts;
        };
    }).factory('EditableShiftsDay', function(ShiftsDayGenerator, ReadOnlyShiftsDayGenerator, BusinessHolder, $q){
        function EditableShiftsDay(date){
            var self = this;

            self.dayOfYear = date.dayOfYear();
            self.date = date;
            self.isEnabled = false;

            if(BusinessHolder.business.shifts[self.dayOfYear]){
                self.readyPromise = ShiftsDayGenerator.byDate(date).then(function(shiftsDay){
                    self.shiftsDay = shiftsDay;
                    return self.shiftsDay;
                });
            }else{
                var defer = $q.defer();
                self.readyPromise = defer.promise;
                this.readOnlyCopy = ReadOnlyShiftsDayGenerator.byDate(date);
                defer.resolve(this.readOnlyCopy);
            }
        }

        EditableShiftsDay.$enable = function(){
            var self = this;

            if(!self.readOnlyCopy){
                self.readOnlyCopy = ReadOnlyShiftsDayGenerator.byDate(self.date);
            }

            ShiftsDayGenerator.byDate(self.date, self.readOnlyCopy).then(function(shiftsDay){
                self.isEnabled = true;
                self.shiftsDay = shiftsDay;
                self.readOnlyCopy = null;
            });
        }

        EditableShiftsDay.$disable = function(){
            this.shiftsDay = null;
            this.shiftsDay.$inst().$set();
            this.shiftsDay.$destroy();
            this.readOnlyCopy = ReadOnlyShiftsDayGenerator.byDate(this.date);
            this.isEnabled = false;
        }

        EditableShiftsDay.$destroy = function(){
            this.shiftsDay.$destroy();
        }

        EditableShiftsDay.$save = function(){
            return this.shiftsDay.$save();
        }



        return EditableShiftsDay;
    }).service('ShiftsDayHolder', function(ReadOnlyShiftsDayGenerator, defer){
        this.$checkIfEventFitsShifts = function (event) {
            var theDateShifts = ReadOnlyShiftsDayGenerator.byDate(event.startTime),
                defer = $q.defer();

            if(theDateShifts.isContainingEvent(event)){
                defer.resolve(true);
            }else{
                var theDayBefore = event.startTime.clone().subtract(1, 'days');
                theDateShifts = ReadOnlyShiftsDayGenerator.byDate(theDayBefore);
                if(theDateShifts.isContainingEvent(event)){
                    defer.resolve(true);
                }else{
                    defer.resolve(false);
                }
            }

            return defer.promise;
        };
    });



