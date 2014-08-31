var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices

    .factory('BasicShiftsDay', function($FirebaseObject, ShiftsDayPrototypeHelpers, $q, $log, DateHelpers, HourFormatFirebase){



        function BasicShiftsDay(firebase, destroyFunction, readyPromise){
            $FirebaseObject.call(this, firebase, destroyFunction, readyPromise);
            angular.extend(this, ShiftsDayPrototypeHelpers)
        };

        BasicShiftsDay.prototype.$$updated = function(snap){
            this.$init(snap.val());
        };

        BasicShiftsDay.prototype.$populate = function(data){
            this.$init(data);
        }



        BasicShiftsDay.prototype.$init = function(val, doInitAnyway){
            if(val || doInitAnyway){
                angular.extend(this,val);
                angular.forEach(this.shifts, angular.bind(this,this.$initShift));
            }
        };

        BasicShiftsDay.prototype.$initShift = function(shift){
            if(!DateHelpers.isMomentValid(shift.startTime)){
                var startTimeArr = shift.startTime.split(':');
                shift.startTime = moment().day(this.dayOfWeek).hour(startTimeArr[0]).minute(startTimeArr[1]);
            }
            if(shift.defaultTime && !DateHelpers.isMomentValid(shift.defaultTime)){
                var defaultTimeArr = shift.defaultTime.split(':');
                shift.defaultTime = moment().day(this.dayOfWeek).hour(startTimeArr[0]).minute(startTimeArr[1]);
            }
        };


        BasicShiftsDay.prototype.$saveWithValidation = function(){
            var self = this;
            return self.$beforeSave().then(function(){
                self.$save();
            }, function(){
            }).catch(function(error){
                $log.error('Cannot save shift ', error);
            });
        };

        BasicShiftsDay.prototype.$beforeSave = function(){
            return this.$validateDate().then(angular.bind(this,this.$validateShifts));
        };


        BasicShiftsDay.prototype.$validateDate = function(){
            var defer = $q.defer();
            if ((!this.dayOfWeek && this.dayOfWeek != 0) ) {
                defer.reject({error: "ERROR_DAY_SHIFTS_INVALID_DAY_OF_WEEK"});
            }

            defer.resolve();
            return defer.promise;
        };

        BasicShiftsDay.prototype.$validateShifts = function(){
            var defer = $q.defer();
            if(!this.shifts || !this.shifts.length){
                rejected = true;
                defer.reject({error : "ERROR_DAY_SHIFTS_INVALID_SHIFTS"})
            }else{
                var currentShift, rejected = false;
                for (var i = 0;i < this.shifts.length; ++i){
                    currentShift = this.shifts[i];
                    if(!currentShift.startTime || !DateHelpers.isMomentValid(currentShift.startTime)){
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


            if(!rejected) {
                defer.resolve();
            }

            return defer.promise;
        }

        BasicShiftsDay.prototype.shiftsToObject = function(){
            var dayOfWeek = this.dayOfWeek;
            var output = [];
            angular.forEach(this.shifts, function(shift){
                var _shift = {};
                _shift.startTime = shift.startTime.format(HourFormatFirebase);
                if(shift.defaultTime) _shift.defaultTime = shift.defaultTime.format(HourFormatFirebase);
                _shift.duration = shift.duration > 0 ?  parseInt(shift.duration) : 0 ;
                _shift.name = shift.name;
                _shift.active = !!shift.active;
                output.push(_shift);
            });

            return output;
        }


        BasicShiftsDay.prototype.toJSON = function(){
            var output = {};
            output.dayOfWeek = this.dayOfWeek;
            output.basic = true;
            output.shifts = this.shiftsToObject();
            return output;
        }
        return BasicShiftsDay;
    })
    .factory("BasicShiftsDayFactory",function ($FirebaseObject, BasicShiftsDay) {
        return $FirebaseObject.$extendFactory(BasicShiftsDay);
    }).factory("BasicShiftsDayObject",function ($firebase, BasicShiftsDayFactory) {
        return function (ref) {
            return $firebase(ref, {objectFactory: BasicShiftsDayFactory}).$asObject();
        }
    })
    .service("BasicShiftsDayGenerator", function(BusinessHolder, BasicShiftsDayObject,BasicShiftsDay, DefaultShiftsDayGenerator){

    var initShift = function(shift){
        shift.startTime = moment(shift.startTime);
        shift.defaultTime = moment(shift.defaultTime);
        shift.duration = parseInt(shift.duration);
    };

    this.rawObjectByDate = function(dayOfWeek){
        var ref = BusinessHolder.business.$inst().$ref().child('shifts').child('basic').child(dayOfWeek);
        return BasicShiftsDayObject(ref);
    };

    this.byDate = function(dayOfWeek){
        return this.rawObjectByDate(dayOfWeek).$loaded().then(function(basicShiftsDay){
            var shouldSave = false;
            if(!basicShiftsDay.shifts){
                var date = moment().day(dayOfWeek);
                var defaultShiftsDay = DefaultShiftsDayGenerator.defaultShiftsDayForDate(null, dayOfWeek);
                basicShiftsDay.shifts = defaultShiftsDay.shifts;
                shouldSave = true;
            }
            if(!basicShiftsDay.dayOfWeek){
                shouldSave = true;
                basicShiftsDay.dayOfWeek = dayOfWeek;
            }
            if(!basicShiftsDay.basic){
                basicShiftsDay.basic = true;
                shouldSave = true;
            }
            if(shouldSave){
                basicShiftsDay.$saveWithValidation();
                basicShiftsDay.$init(null, true);
            }

            return basicShiftsDay;
        });

    };

})