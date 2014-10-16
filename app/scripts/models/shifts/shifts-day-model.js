var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .value('ShiftsDayDefaults', [
        {
            name : "morning",
            startTime : "08:00",
            duration : 240,
            active : true
        },
        {
            name : "noon",
            startTime : "12:00",
            duration : 240,
            active : true
        },
        {
            name : "evening",
            startTime : "16:00",
            duration : 240,
            active : true
        }
    ])
    .factory('Shift', function(BasicShift, DateHelpers, HourFormatFirebase){

        function ShiftException(message) {
            this.name = 'ShiftException';
            this.message= message;
        }
        ShiftException.prototype = new Error();
        ShiftException.prototype.constructor = ShiftException;


        function Shift(data){
            if(!data){
                throw new ShiftException('Cannot init new shift without data.');
            }else if(!data.startTime) {
                throw new ShiftException('Cannot init new shift. Please provide a valid startTime');
            }else if(!data.name){
                throw new ShiftException('Cannot init new shift. Please provide shift name value');
            }else if(!data.duration){
                throw new ShiftException('Cannot init new shift. Please provide duration value ');
            }

            data.startTime = (DateHelpers.isMomentValid(data.startTime)) ? data.startTime.clone() : moment(data.startTime);
            if(!DateHelpers.isMomentValid(data.startTime)){
                throw new ShiftException('Cannot init new shift. Please provide a valid startTime moment object');
            }


            data.duration = parseInt(data.duration);
            if(!angular.isNumber(data.duration) || data.duration <= 0){
                throw new ShiftException('Cannot init new shift. Please provide valid duration ( > 0 )');
            }

            data.defaultTime = (DateHelpers.isMomentValid(data.defaultTime)) ? data.defaultTime.clone() : moment(data.defaultTime);


            this.name = data.name;
            this.duration = data.duration;
            this.startTime = data.startTime;
            this.defaultTime = (DateHelpers.isMomentValid(data.defaultTime)) ? data.defaultTime : data.startTime.clone();
            this.active = data.active;
        };


        Shift.initFromBasicShiftAndDate = function(basicShift, date) {
            if (!basicShift) {
                throw new ShiftException('Cannot init new shift from basic shift. Please provide a valid basicShift');
            } else if (!basicShift instanceof BasicShift) {
                throw new ShiftException('Cannot init new shift from basic shift. Please provide a valid basicShift BasicShift object');
            } else if (!DateHelpers.isMomentValid(date)) {
                throw new ShiftException('Cannot init new shift from basic shift. Please provide a valid date moment object');
            }

            var startTime = basicShift.startTime.clone();
            if (!DateHelpers.isMomentValid(startTime)) {
                throw new ShiftException('Cannot init new shift from basic shift. Cannot parse startTime');
            }


            var defaultTime = basicShift.defaultTime.clone();
            if (!DateHelpers.isMomentValid(defaultTime)) {
                defaultTime = startTime.clone();
            }


            startTime.date(date.date()).year(date.year()).month(date.month());
            var data = {
                name: basicShift.name,
                active: basicShift.active,
                duration: basicShift.duration,
                startTime: startTime,
                defaultTime: defaultTime
            }

            return new Shift(data);
        };


        Shift.prototype.getEndTime = function(){
            return this.startTime.clone().add(this.duration, 'minutes');
        };

        Shift.prototype.isEventWithin = function(event){
            if(!event){
                return false;
            }

            var endTime = this.getEndTime();
//          var isOverlappingShift = event.data.startTime.isBefore(this.startTime, 'minutes') && event.data.endTime.isAfter(this.startTime, 'minutes'),
            var isSameStart = event.data.startTime.isSame(this.startTime, 'minutes');
            var isStartingWithinShift =  (event.data.startTime.isAfter(this.startTime, 'minutes') && (event.data.startTime.isBefore(endTime, 'minutes')));
//            var isStartTimeSameAsEndtime = event.data.startTime.isSame(endTime, 'minutes');

            return  isSameStart || isStartingWithinShift;
        }

        Shift.prototype.toObject = function(){
            return {
                name : this.name,
                duration : this.duration,
                startTime : this.startTime.toJSON(),
                defaultTime : this.defaultTime.toJSON(),
                active : this.active
            }
        };


        Shift.prototype.$validate = function(){
            if (DateHelpers.isMomentValid(this.startTime)){
                throw new ShiftException("Shift validation failed. 'startTime' should be moment object");
            }else if(!this.name){
                throw new ShiftException("Shift validation failed. 'name' is missing.");
            }else if(!this.duration){
                throw new ShiftException("Shift validation failed. 'duration' is missing.");
            } else if(!angular.isNumber(this.duration) || this.duration <= 0){
                throw new ShiftException("Shift  validation failed. 'duration' should value numeric value ( > 0 )");
            }

            return true;
        };



        return Shift;

    })

    .factory('ShiftsDayPrototype', function(){
        function ShiftsDayPrototype(){

        }

        ShiftsDayPrototype.prototype.isContainingEvent = function(event){
            for (var i = 0 ; i < this.shifts.length; ++i){
                if(this.shifts[i].isEventWithin(event)){
                    return true;
                }
            }
            return false;
        };


        return ShiftsDayPrototype;
    })
    .factory('ShiftsDay', function($FirebaseObject, $q, Shift, ShiftsDayPrototype, DefaultShiftsGenerator, BusinessHolder, BasicShift, DateHolder){


        function ShiftsDay(firebase, destroyFunction, readyPromise){
            if(firebase && destroyFunction && readyPromise){
                $FirebaseObject.call(this, firebase, destroyFunction, readyPromise);
            }
        };

        angular.extend(ShiftsDay.prototype, ShiftsDayPrototype.prototype);


        ShiftsDay.prototype.$$updated = function(snap){
            this.$init(snap.val());
        };

        ShiftsDay.prototype.$populate = function(data){
            this.$init(data);
        }

        ShiftsDay.prototype.$findStartEndTimesOfDay = function(){
            var startTime, endTime, currentShiftEndTime, currentShift;
            for (var i = 0; i < this.shifts.length ;++i){
                currentShift = this.shifts[i];
                currentShiftEndTime = currentShift.startTime.clone().add(currentShift.duration, 'minutes');
                if(!startTime || startTime.isAfter(currentShift.startTime)){
                    startTime = currentShift.startTime.clone();
                }
                if(!endTime || endTime.isBefore(currentShiftEndTime)){
                    endTime = currentShiftEndTime;
                }
            }
            return {
                startTime : startTime,
                endTime  :endTime
            }
        }


        ShiftsDay.prototype.$init = function(val){
            angular.extend(this,val);
            this.date = moment(this.date);
            if(!this.date.isValid || !this.date.isValid()){
                throw new TypeError("Not a valid date");
            }
            if(this.shifts){
                for (var i = 0 ; i < this.shifts.length; ++i){
                    if(!this.shifts[i] instanceof Shift){
                        this.shifts[i] = new Shift(this.shifts[i]);
                    }
                }
            }
        };

        ShiftsDay.prototype.$requireDefaults = function(date){
            this.date = date;
            if(!this.shifts){
                var myDayOfWeek = this.date.day();
                if(BusinessHolder.business.shifts.basic[myDayOfWeek] && BusinessHolder.business.shifts.basic[myDayOfWeek].shifts){
                    this.$initShiftsWithBasicShifts(BusinessHolder.business.shifts.basic[myDayOfWeek].shifts);
                }else{
                    this.$initDefaultShifts();
                }
            }
        };


        ShiftsDay.prototype.$initShiftsWithBasicShifts = function(basicShifts){
            var self = this;
            this.shifts = [];

            angular.forEach(basicShifts, function(shift){
                var basicShift = new BasicShift(shift, DateHolder.currentDate);
                self.shifts.push(new Shift.initFromBasicShiftAndDate(basicShift,self.date));
            });
        };


        ShiftsDay.prototype.$initDefaultShifts = function(){
            this.shifts = DefaultShiftsGenerator(this.date);
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
            var defer = $q.defer(),
                currentShift,
                rejected = false;

            if(!this.shifts || !this.shifts.length){
                rejected = true;
                defer.reject({error : "ERROR_DAY_SHIFTS_NO_SHIFTS"})
            }else{

                for (var i = 0;i < this.shifts.length; ++i){
                    currentShift = this.shifts[i];
                    if(!currentShift instanceof Shift) {
                        defer.reject({error: "ERROR_SHIFTS_DAY_INVALID_SHIFTS_WRONG_SHIFT"})
                        rejected = true;
                        break;
                    }else if(!currentShift.startTime.isSame(this.date, 'day')){
                        defer.reject({error: "ERROR_SHIFTS_DAY_WRONG_SHIFT_START_TIME"})
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

            if(!rejected) defer.resolve();

            return defer.promise;
        }

        ShiftsDay.prototype.shiftsToObject = function(){
            var output = [];
            angular.forEach(this.shifts, function(shift){
                output.push(shift.toObject());
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

        ShiftsDay.prototype.activeShifts = function(){
            return _.filter(this.shifts, function(shift){
               return shift.active;
            });
        }

        return ShiftsDay;
    }).factory("ShiftsDayFactory",function ($FirebaseObject, ShiftsDay) {
        return $FirebaseObject.$extendFactory(ShiftsDay);
    }).factory("ShiftsDayObject",function ($firebase, ShiftsDayFactory) {
        return function (ref) {
            return $firebase(ref, {objectFactory: ShiftsDayFactory}).$asObject();
        }
    }).factory("ShiftsDayGenerator", function(BusinessHolder, ShiftsDayObject,ShiftsDay, DateFormatFirebase){
        return function(date){
            var formattedDate = date.format(DateFormatFirebase);

            var ref = BusinessHolder.business.$inst().$ref().child('shifts').child(formattedDate);
            var shiftDay = ShiftsDayObject(ref);
            shiftDay.$requireDefaults(date);
            return shiftDay;
        };
    }).factory('DefaultShiftsGenerator', function(BusinessHolder, ShiftsDayDefaults, HourFormatFirebase, DateHelpers, Shift, BasicShift){

        function DefaultShiftsGeneratorException(message) {
            this.name = 'DefaultShiftsGeneratorException';
            this.message= message;
        }
        DefaultShiftsGeneratorException.prototype = new Error();
        DefaultShiftsGeneratorException.prototype.constructor = DefaultShiftsGeneratorException;


        return function(date){
            var shifts = [];

            if(!DateHelpers.isMomentValid(date)){
                throw new DefaultShiftsGeneratorException('Failed to create shift, no date was provided');
            }else{
            }

            angular.forEach(ShiftsDayDefaults, function(defaultShift){
                var basicShift = new BasicShift(defaultShift);
                shifts.push(new Shift.initFromBasicShiftAndDate(basicShift,shiftsDay.date));
            });

            return shifts;
        }

    }).factory('AllDayShift', function(DateHolder,FullDateFormat, Shift){
        var defaults = {
            active : true,
            name : "ENTIRE_DAY"
        }

        function AllDayShiftException(message) {
            this.name = 'AllDayShiftException';
            this.message= message;
        }
        AllDayShiftException.prototype = new Error();
        AllDayShiftException.prototype.constructor = AllDayShiftException;


        return function(shiftsDay){
            var dateMoment, startTime, defaultTime, duration;


            if(shiftsDay){
                var startAndEndTimes = shiftsDay.$findStartEndTimesOfDay();
                if(startAndEndTimes && startAndEndTimes.startTime && startAndEndTimes.endTime){
                    defaultTime = startAndEndTimes.startTime.clone();
                    startTime = startAndEndTimes.startTime.clone();
                    duration = startAndEndTimes.endTime.diff(startTime, 'minutes');
                }else{
                    throw new AllDayShiftException('Cannot get shifts day start and end times');
                }
            }else{
                if(DateHolder.currentDate){
                    dateMoment = DateHolder.currentDate.clone()
                }else{
                    dateMoment = moment();
                }
                defaultTime = dateMoment.clone();
                startTime = dateMoment.clone().hour(0).minutes(0).seconds(0);
                duration = 24*60;
            }

            return new Shift(angular.extend(defaults, {
                startTime : startTime,
                duration : duration,
                defaultTime : defaultTime
            },{}));
        }
    });




