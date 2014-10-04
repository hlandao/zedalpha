var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices

    .factory('BasicShift', function(HourRegex, HourFormatFirebase, DateHelpers){

        function BasicShiftException(message) {
            this.name = 'BasicShiftException';
            this.message= message;
        }
        BasicShiftException.prototype = new Error();
        BasicShiftException.prototype.constructor = BasicShiftException;


        function BasicShift(data){
            if(!data){
                throw new BasicShiftException('Cannot init new basic shift without data.');
            }else if(!data.startTime) {
                throw new BasicShiftException('Cannot init new basic shift. Please provide startTime value');
            } else if (!HourRegex.pattern.test(data.startTime)){
                throw new BasicShiftException('Cannot init new basic shift. Please provide a valid startTime (xx:xx)');
            }else if(!data.name){
                throw new BasicShiftException('Cannot init new basic shift. Please provide shift name value');
            }else if(!data.duration){
                throw new BasicShiftException('Cannot init new basic shift. Please provide duration value ');
            }

            data.duration = parseInt(data.duration);
            if(!angular.isNumber(data.duration) || data.duration <= 0){
                throw new BasicShiftException('Cannot init new shift. Please provide valid duration ( > 0 )');
            }


            if(data.defaultTime){
                data.defaultTime = moment(data.defaultTime, HourFormatFirebase);
            }


            this.name = data.name;
            this.duration = data.duration;
            this.startTime = moment(data.startTime, HourFormatFirebase);
            this.defaultTime = (DateHelpers.isMomentValid(data.defaultTime)) ? data.defaultTime : this.startTime.clone();
            this.active = data.active;
        }

        BasicShift.prototype.$validate = function(){
            if (DateHelpers.isMomentValid(this.startTime)){
                throw new BasicShiftException("Basic shift validation failed. 'startTime' should be moment object");
            }else if(!this.name){
                throw new BasicShiftException("Basic shift validation failed. 'name' is missing.");
            }else if(!this.duration){
                throw new BasicShiftException("Basic shift validation failed. 'duration' is missing.");
            } else if(!angular.isNumber(this.duration) || this.duration <= 0){
                throw new BasicShiftException("Basic shift validation failed. 'duration' should value numeric value ( > 0 )");
            }

            return true;
        };

        BasicShift.prototype.toObject = function(){
            return {
                name : this.name,
                duration : this.duration,
                startTime : this.startTime.format(HourFormatFirebase),
                defaultTime : this.defaultTime.format(HourFormatFirebase),
                active : this.active
            }
        };

        return BasicShift;

    })
    .factory('BasicShiftsDay', function($FirebaseObject,ShiftsDayPrototype, $q, $log, DateHelpers, HourFormatFirebase, BasicShift, ShiftsDayPrototype, DefaultBasicShiftsGenerator, asyncThrow){


        function BasicShiftDayException(message) {
            this.name = 'BasicShiftDayException';
            this.message= message;
        }
        BasicShiftDayException.prototype = new Error();
        BasicShiftDayException.prototype.constructor = BasicShiftDayException;


        function BasicShiftsDay(firebase, destroyFunction, readyPromise){
            $FirebaseObject.call(this, firebase, destroyFunction, readyPromise);
        };

        angular.extend(ShiftsDay.prototype, ShiftsDayPrototype.prototype);


        BasicShiftsDay.prototype.$$updated = function(snap){
            this.$init(snap.val());
        };


        BasicShiftsDay.prototype.$populate = function(data){
            this.$init(data);
        }


        BasicShiftsDay.prototype.$init = function(val){
            if(val){
                angular.extend(this,val);
            }
            if(this.shifts){
                for (var  i = 0 ; i < this.shifts.length; ++i){
                    if(!this.shifts[i] instanceof BasicShift){
                        this.shifts[i] = new BasicShift(this.shifts[i]);
                    }
                }
            }
        };

        BasicShiftsDay.prototype.$initDefaultShifts = function(){
            this.shifts = DefaultBasicShiftsGenerator(this.dayOfWeek);
        }


        BasicShiftsDay.prototype.$saveWithValidation = function(){
            var self = this;
            return self.$beforeSave().then(function(){
                self.$save();
            }, function(){
            }).catch(function(error){
                throw new BasicShiftDayException('Cannot save shift. Error : ' + error);
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
                    if(!currentShift instanceof BasicShift) {
                        defer.reject({error: "ERROR_BASIC_DAY_SHIFTS_INVALID_SHIFTS_WRONG_SHIFT"})
                        rejected = true;
                        break;
                    }
                    try{
                        currentShift.$validate();
                    }catch(error){
                        defer.reject({error: error})
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
            var output = [];
            angular.forEach(this.shifts, function(shift){
                output.push(shift.toObject());
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
    .service("BasicShiftsDayGenerator", function(BusinessHolder, BasicShiftsDayObject,BasicShiftsDay, DefaultBasicShiftsGenerator){

    var rawObjectByDayOfWeek = function(dayOfWeek){
        var ref = BusinessHolder.business.$inst().$ref().child('shifts').child('basic').child(dayOfWeek);
        return BasicShiftsDayObject(ref);
    };

    this.byDayOfWeek = function(dayOfWeek){
        return rawObjectByDayOfWeek(dayOfWeek).$loaded().then(function(basicShiftsDay){
            var shouldSave = false;
            if(!basicShiftsDay.shifts){
                basicShiftsDay.$initDefaultShifts();
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
                basicShiftsDay.$init();
            }

            return basicShiftsDay;
        });

    };

})
.factory('DefaultBasicShiftsGenerator', function(BusinessHolder, ShiftsDayDefaults, BasicShift){

        function DefaultBasicShiftsGeneratorException(message) {
            this.name = 'DefaultBasicShiftsGeneratorException';
            this.message= message;
        }
        DefaultBasicShiftsGeneratorException.prototype = new Error();
        DefaultBasicShiftsGeneratorException.prototype.constructor = DefaultBasicShiftsGeneratorException;


        return function(dayOfWeek){
            var shifts = []

            if(!dayOfWeek || dayOfWeek < 0 || dayOfWeek > 6) {
                throw new DefaultBasicShiftsGeneratorException('Failed to create default basic shift day, no dayOfWeek was provided');
            }

            angular.forEach(ShiftsDayDefaults, function(defaultShift){
                shifts.push(new BasicShift(defaultShift));
            });

            return shifts;
        }
    });