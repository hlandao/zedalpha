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
                defaultDuration : 4 * 60
            },
            {
                name : "evening",
                defaultStartTime : moment().hour(18).minute(0).seconds(0),
                defaultDuration : 4 * 60
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
                var isOverlappingShift = event.data.startTime.isBefore(shift.startTime, 'minutes') && event.data.startTime.isAfter(shift.startTime, 'minutes'),
                    isStartingWithinShift = event.data.startTime.isSame(shift.startTime, 'minutes') || (event.data.startTime.isAfter(shift.startTime, 'minutes') && (event.data.startTime.isBefore(shift.endTime, 'minutes') || event.data.startTime.isSame(shift.endTime, 'minutes')));

                return isOverlappingShift || isStartingWithinShift;
            }
        }
    })
    .factory('ShiftsDay', function($FirebaseObject, ShiftsDayPrototypeHelpers, $q){


        var initShift = function(shift){
            shift.startTime = moment(shift.startTime);
            shift.defaultTime = moment(shift.defaultTime);
            shift.duration = parseInt(shift.duration);
            delete shift.endTime;
        };

        function ShiftsDay(firebase, destroyFunction, readyPromise){
            $FirebaseObject.call(this, firebase, destroyFunction, readyPromise);
            angular.extend(this, ShiftsDayPrototypeHelpers)
        };

        ShiftsDay.prototype.$$updated = function(snap){
            this.$init(snap.val());
        };

        ShiftsDay.prototype.$populate = function(data){
            this.$init(data);
        }



        ShiftsDay.prototype.$init = function(val){
            angular.extend(this,val);
            if(this.basic){
                this.dayOfWeek = this.$id;
                delete this.date;
                delete this.isEnabled;
                delete this.active;
            }else{
                this.date = moment(this.date);
                if(!this.date.isValid || !this.date.isValid()){
                    this.date = moment();
                }
            }
            angular.forEach(this.shifts, initShift);
        };

        ShiftsDay.prototype.$saveWithValidation = function(){
            var self = this;
            return self.$save();;
            return self.$beforeSave(function(){
                self.$save();
            })
        };

        ShiftsDay.prototype.$beforeSave = function(){
            return this.$validateDate().then(this.$validateShifts());
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
                    if(!currentShift.startTime){
                        defer.reject({error : "ERROR_DAY_SHIFTS_INVALID_SHIFTS_NO_START_TIME"})
                        rejected = true;
                        break;
                    }else if(!currentShift.name){
                        defer.reject({error : "ERROR_DAY_SHIFTS_INVALID_SHIFTS_NO_NAME"})
                        rejected = true;
                        break;
                    }
                }
            }

            if(!rejected) defer.resolve();

            return defer.promise;
        }

        ShiftsDay.prototype.shiftsToObject = function(){
            var output = [];
            angular.forEach(this.shifts, function(shift){
               var _shift = {};
                _shift.startTime = moment(shift.startTime).toJSON();
                _shift.defaultTime = moment(shift.defaultTime).toJSON();
                _shift.duration = shift.duration > 0 ?  parseInt(shift.duration) : 0 ;
                _shift.name = shift.name;
                _shift.active = !!shift.active;
                 output.push(_shift);
            });

            return output;
        }


        ShiftsDay.prototype.toJSON = function(){
            var output = {};
            output.basic = !!this.basic;
            if(!this.basic){
                output.date = moment(this.date).toJSON();
                output.isEnabled = !!this.isEnabled;
            }else{
                output.dayOfWeek = this.dayOfWeek;
            }
            output.shifts = this.shiftsToObject();

            return output;
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
                   shiftsDay.$populate(shiftsData);
               }else{
                   if(!shiftsDay.shifts){
                       var readOnlyShiftForDate = ReadOnlyShiftsDayGenerator.byDate(date);
                       shiftsDay.$populate(readOnlyShiftForDate);
                       shiftsDay.$saveWithValidation();
//                       shiftsDay.$inst().$set(readOnlyShiftForDate);
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
                isEnabled : true,
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

        this.byDate = function(date, extendProto, tryBasicShifts){
            var dayOfYear = date.dayOfYear(),
                dayOfWeek,
                dayShifts;

            if(BusinessHolder.business.shifts && BusinessHolder.business.shifts[dayOfYear]){
                dayShifts = BusinessHolder.business.shifts[dayOfYear];
            }else{
                dayOfWeek = date.day();
                if(tryBasicShifts && BusinessHolder.business.shifts.basic[dayOfWeek]){
                    dayShifts = basicShiftsDayForDate(BusinessHolder.business.shifts.basic[dayOfWeek], date);
                }else{
                    dayShifts = defaultShiftsDayForDate(date);
                }
            }

            if(extendProto) angular.extend(dayShifts, ShiftsDayPrototypeHelpers);
            return dayShifts;
        };
    }).factory('EditableShiftsDay', function(ShiftsDayGenerator, ReadOnlyShiftsDayGenerator, BusinessHolder, $q){
        function EditableShiftsDay(date){
            var self = this;

            self.dayOfYear = date.dayOfYear();
            self.date = date.clone();
            self.isEnabled = false;

            if(BusinessHolder.business.shifts[self.dayOfYear]){
                self.readyPromise = ShiftsDayGenerator.byDate(date).then(function(shiftsDay){
                    self.isEnabled = true;
                    self.shiftsDay = shiftsDay;
                    return self.shiftsDay;
                });
            }else{
                var defer = $q.defer();
                self.readyPromise = defer.promise;
                self.readOnlyCopy = ReadOnlyShiftsDayGenerator.byDate(date);
                defer.resolve(self.readOnlyCopy);
            }
        }

        EditableShiftsDay.prototype.$enable = function(){
            console.log('$enable');
            var self = this;

            if(!self.readOnlyCopy){
                self.readOnlyCopy = ReadOnlyShiftsDayGenerator.byDate(self.date);
            }

            ShiftsDayGenerator.byDate(self.date, self.readOnlyCopy).then(function(shiftsDay){
                self.isEnabled = true;
                self.shiftsDay = shiftsDay;
                self.readOnlyCopy = null;
                console.log('self',self);
            });
        }

        EditableShiftsDay.prototype.$disable = function(){
            this.shiftsDay.$inst().$set();
            this.shiftsDay.$destroy();
            this.shiftsDay = null;
            this.readOnlyCopy = ReadOnlyShiftsDayGenerator.byDate(this.date);
            this.isEnabled = false;
        }

        EditableShiftsDay.prototype.$destroy = function(){
            this.shiftsDay.$destroy();
        }

        EditableShiftsDay.prototype.$toggleEnabled = function(){
            if(this.isEnabled){
                this.$enable();
            }else{
                this.$disable();
            }
        }

        EditableShiftsDay.prototype.$save = function(){
            return this.shiftsDay.$save();
        }



        return EditableShiftsDay;
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



