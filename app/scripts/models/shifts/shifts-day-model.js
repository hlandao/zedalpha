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
    .service('DefaultShiftsDayGenerator', function(BusinessHolder, ShiftsDayDefaults, ShiftsDayPrototypeHelpers, HourFormatFirebase){
        this.defaultShiftsDayForDate = function(date, dayOfWeek){
            var shiftsDay = {
                shifts : []
            };

            if(date){
                angular.extend(shiftsDay, {
                    date : date.clone(),
                    basic : false,
                    isEnabled : true,
                });
            }else if(dayOfWeek >= 0){
                angular.extend(shiftsDay, {
                    dayOfWeek : dayOfWeek,
                    basic : true,
                });
            }else{
                throw new TypeError('Failed to create shift, no date or dayOfWeek specified');
            }

            angular.forEach(ShiftsDayDefaults, function(defaultShift){
                var newShift;
                if(shiftsDay.basic){
                    newShift = createDefaultShiftObjectForBasic(defaultShift);
                }else{
                    newShift = createDefaultShiftForDate(defaultShift);
                }
                shiftsDay.shifts.push(newShift);
            });

            return shiftsDay;
        }

        var createDefaultShiftObjectForBasic = function(defaultShift){
            return {
                name : defaultShift.name,
                startTime : defaultShift.defaultStartTime.format(HourFormatFirebase),
                duration : defaultShift.defaultDuration,
                active : true
            };
        }

        var createDefaultShiftForDate = function(defaultShift){
            return {
                name : defaultShift.name,
                startTime : defaultShift.defaultStartTime.clone(),
                duration : defaultShift.defaultDuration,
                active : true
            }
        }
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
                var endTime = shift.startTime.clone().add(shift.duration, 'minutes');
                var isOverlappingShift = event.data.startTime.isBefore(shift.startTime, 'minutes') && event.data.startTime.isAfter(shift.startTime, 'minutes'),
                    isStartingWithinShift = event.data.startTime.isSame(shift.startTime, 'minutes') || (event.data.startTime.isAfter(shift.startTime, 'minutes') && (event.data.startTime.isBefore(endTime, 'minutes') || event.data.startTime.isSame(endTime, 'minutes')));

                return isOverlappingShift || isStartingWithinShift;
            }
        }
    })
    .factory('ShiftsDay', function($FirebaseObject, ShiftsDayPrototypeHelpers, $q){



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
            this.date = moment(this.date);
            if(!this.date.isValid || !this.date.isValid()){
                throw new TypeError("Not a valid date");
            }
            angular.forEach(this.shifts, angular.bind(this,this.$initShift));
        };

        ShiftsDay.prototype.$initShift = function(shift){
            shift.startTime = moment(shift.startTime);
            shift.defaultTime = moment(shift.defaultTime);
            shift.duration = parseInt(shift.duration);
        };


        ShiftsDay.prototype.$saveWithValidation = function(){
            var self = this;
            return self.$beforeSave(function(){
                self.$save();
            })
        };

        ShiftsDay.prototype.$beforeSave = function(){
            return this.$validateDate().then(this.$validateShifts);
        };


        ShiftsDay.prototype.$validateDate = function(){
            var defer = $q.defer();
            if ((!this.date || !this.date.isValid || !this.date.isValid()) ) {
                defer.reject({error: "ERROR_DAY_SHIFTS_INVALID_DATE"});
            }
            defer.resolve();
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
                    if(!currentShift.startTime || !DateHelpers.isMomentValid(currentShift.startTime) || !currentShift.startTime.isSame(this.date, 'day')){
                        defer.reject({error : "ERROR_DAY_SHIFTS_INVALID_SHIFTS_NO_START_TIME"})
                        rejected = true;
                        break;
                    }else if(!currentShift.name){
                        defer.reject({error : "ERROR_DAY_SHIFTS_INVALID_SHIFTS_NO_NAME"})
                        rejected = true;
                        break;
                    }else if(!currentShift.duration){
                        defer.reject({error : "ERROR_DAY_SHIFTS_INVALID_SHIFTS_NO_DURATION"})
                        rejected = true;
                        break;
                    }
                }
            }

            if(!rejected) defer.resolve();

            return defer.promise;
        }

        ShiftsDay.prototype.shiftsToObject = function(){
            var theDate = this.date;
            var output = [];
            angular.forEach(this.shifts, function(shift){
                var _shift = {};

                if(!shift.startTime.isSame(theDate, 'day')){
                    shift.startTime.date(theDate.date()).month(theDate.month()).year(theDate.year());
                }
                _shift.startTime = shift.startTime.toJSON();

                if(!shift.defaultTime.isSame(theDate, 'day')){
                    shift.defaultTime.date(theDate.date()).month(theDate.month()).year(theDate.year());
                }
                _shift.defaultTime = shift.defaultTime.toJSON();
                _shift.duration = shift.duration > 0 ?  parseInt(shift.duration) : 0 ;
                _shift.name = shift.name;
                _shift.active = !!shift.active;
                output.push(_shift);
            });

            return output;
        }


        ShiftsDay.prototype.toJSON = function(){
            var output = {};
            output.date = this.date.toJSON();
            output.isEnabled = !!this.isEnabled;
            output.shifts = this.shiftsToObject();
            return output;
        }
        return ShiftsDay;
    }).factory("ShiftsDayFactory",function ($FirebaseObject, ShiftsDay) {
        return $FirebaseObject.$extendFactory(ShiftsDay);
    }).factory("ShiftsDayObject",function ($firebase, ShiftsDayFactory) {
        return function (ref) {
            return $firebase(ref, {objectFactory: ShiftsDayFactory}).$asObject();
        }
    }).service("ShiftsDayGenerator", function(BusinessHolder, ShiftsDayObject,ShiftsDay, ReadOnlyShiftsDayGenerator, DateFormatFirebase){


        this.rawObjectByDate = function(date){
            var formattedDate = date.format(DateFormatFirebase);
            var ref = BusinessHolder.business.$inst().$ref().child('shifts').child(formattedDate);
            return ShiftsDayObject(ref);
        };

        this.byDate = function(date, shiftsData){
            return this.rawObjectByDate(date).$loaded().then(function(shiftsDay){
               if(shiftsData){
                   shiftsDay.$populate(shiftsData);
               }else{
                   if(!shiftsDay.shifts){
                       var readOnlyShiftsForDate = ReadOnlyShiftsDayGenerator.byDate(date, {
                           trySavedDate : false,
                           tryBasicShifts : true,
                           extendProto : false
                       });
                       shiftsDay.$populate(readOnlyShiftsForDate);
                       shiftsDay.$saveWithValidation();
//                       shiftsDay.$inst().$set(readOnlyShiftForDate);
                   }
               }
                return shiftsDay;
            });

        };

    })
    .service('ReadOnlyShiftsDayGenerator', function(BusinessHolder, DateHelpers, ShiftsDayDefaults, ShiftsDayPrototypeHelpers, DefaultShiftsDayGenerator){
        function ReadOnlyShiftsDayGenerator(){

        };

        var basicShiftsDayForDate = function(basicShiftsDay, date){
            var cloned = angular.extend({}, basicShiftsDay);
            cloned.date = date.clone();
            cloned.basic = false;
            angular.forEach(cloned.shifts, function(shift){
                if(DateHelpers.isMomentValid(shift.startTime)){
                    shift.startTime = shift.startTime.clone().dayOfYear(date.dayOfYear());
                }else{
                    var startTimeArr = shift.startTime.split(':');
                    shift.startTime = date.clone().hour(startTimeArr[0]).minute(startTimeArr[1]);
                }
            });
            return cloned;
        }



        this.byDate = function(date, settings){
            settings = angular.extend({
                extendProto : false,
                trySavedDate : true,
                tryBasicShifts : false
            }, settings);

            var dayOfYear = date.dayOfYear(),
                dayOfWeek,
                dayShifts;

            if(settings.trySavedDate && BusinessHolder.business.shifts && BusinessHolder.business.shifts[dayOfYear]){
                dayShifts = BusinessHolder.business.shifts[dayOfYear];
            }else{
                dayOfWeek = date.day();
                if(settings.tryBasicShifts && BusinessHolder.business.shifts.basic[dayOfWeek]){
                    dayShifts = basicShiftsDayForDate(BusinessHolder.business.shifts.basic[dayOfWeek], date);
                }else{
                    dayShifts = DefaultShiftsDayGenerator.defaultShiftsDayForDate(date, dayOfWeek);
                }
            }

            if(settings.extendProto) angular.extend(dayShifts, ShiftsDayPrototypeHelpers);
            return dayShifts;
        };
    }).factory('EditableShiftsDay', function(ShiftsDayGenerator, ReadOnlyShiftsDayGenerator, BusinessHolder, $q, DateFormatFirebase){
        function EditableShiftsDay(date){
            var self = this;

            self.dayOfYear = date.format(DateFormatFirebase);
            self.date = date.clone();
            self.isEnabled = false;

            if(BusinessHolder.business.shifts && BusinessHolder.business.shifts[self.dayOfYear]){
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
                dateMoment = DateHolder.currentDate.clone()
            }else{
                dateMoment = moment();
            }

            var defaultTime = dateMoment;
            var startTime = dateMoment.clone().hour(0).minutes(0).seconds(0);
            var duration = 24*60;


            return angular.extend(defaults, {
                startTime : startTime,
                duration : duration,
                defaultTime : defaultTime
            })
        }
    });



