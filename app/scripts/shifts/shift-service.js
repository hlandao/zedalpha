var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .service('ShiftsNames', function(){
        return [
                {
                    name : "morning",
                    defaultStartTime : moment().hour(8).minute(0),
                    defaultEndTime : moment().hour(12).minute(0)
                },
                {
                    name : "noon",
                    defaultStartTime : moment().hour(12).minute(0),
                    defaultEndTime : moment().hour(18).minute(0)
                },
                {
                    name : "evening",
                    defaultStartTime : moment().hour(18).minute(0),
                    defaultEndTime : moment().hour(23).minute(59)
                }
            ]
    })
    .factory('ShiftsWeek', function(ShiftDay, BasicShiftDay, $q){
        function ShiftsWeek(weekNumber){
            this.days = [];
            if(weekNumber != 'basic'){
                var dateMoment = moment().week(weekNumber).day(0);
                for(var i = 0; i < 7; ++i){
                    this.days.push(new ShiftDay(dateMoment));
                    dateMoment.add('days',1);
                }

            }else{
                for(var i = 0; i < 7; ++i){
                    this.days.push(new BasicShiftDay(i));
                }
            }

            return this;
        }

        ShiftsWeek.prototype.saveAllDays = function(){
//            var defer = $q.defer();
//            defer.resolve();
//            return defer.promise;

            var day,
                promises = [];

            for (var i = 0; i < this.days.length; ++i){
                day = this.days[i];
                if(day.enableCustom || day.shifts.basic){
                    if(day.save) promises.push(day.save());
                }else{
                    if(day.remove) promises.push(day.remove());
                }
            }

            return $q.all(promises);
        }

        return ShiftsWeek;
    })
    .factory('ShiftDay', function(Shifts, Shift, ShiftsNames, $q){
        function ShiftDay(date, shiftData){
            var self = this;
            if(shiftData){
                angular.extend(this, shiftData);
                return this;
            }
            if(date){
                this.date = date ? new Date(date) : new Date();
                this.dayOfYear = moment(this.date).dayOfYear();
                this.shifts = Shifts.shiftsWithDayOfYear(this.dayOfYear);
                var ref = this.shifts.$getRef();
                ref.once('value', function(snapshot){
                    if(!snapshot.val()){
                        self.generateDefaultShifts();
                    }
                });
                return this;
            }
            throw new Error('Please provide a valid date');

        }

        ShiftDay.prototype.save = function(){
            console.log('save!');
            var defer = $q.defer();
            if(!this.shifts || (!this.shifts.enableCustom && !this.basic)){
                defer.reject();
                return defer.promise;
            }
            var self = this;
            this.shifts.$on('value', function(){
                self.shifts.$off('value');
                defer.resolve();
            });

            this.shifts.$save();
            return defer.promise;
        }

        ShiftDay.prototype.remove = function(){
            var ref = this.shifts.$getRef();
            this.shifts.$off();
            ref.remove();
            var defer = $q.defer();
            defer.resolve();
            return defer.promise;
        }



        ShiftDay.prototype.generateDefaultShifts = function(){
            this.shifts.date = this.date;
            this.shifts.shifts = [];
            for(var i in ShiftsNames){
                this.shifts.shifts[i] = Shift.defaultShiftForShiftIndex(i, null, true);
            }
        }

        ShiftDay.prototype.wasChanged = function(){
            console.log('this',this);
            if(this.shifts.enableCustom){
                return this.save();
            }else{
                return this.remove();
            }
        }


        return ShiftDay;
    })
    .factory('BasicShiftDay', function($rootScope, Shifts, ShiftDay, Shift, ShiftsNames, BusinessHolder,$q, FullDateFormat){
        function BasicShiftDay(dayOfWeek, data,date){
            var self = this;

            if(data){
                angular.extend(this, data);
                if(date){
                    var newStartTimeMoment = moment(date),
                        newEndTimeMoment = moment(date),
                        newDefaultTimeMoment = moment(date),
                        oldStartTimeMoment,
                        oldEndTimeMoment,
                        oldDefaultTimeMoment;


                    this.date = newStartTimeMoment.format(FullDateFormat);
                    for (var i = 0; i < this.shifts.length; ++i){
                        var oldStartTimeMoment = moment(this.shifts[i].startTime);
                        var oldEndTimeMoment = moment(this.shifts[i].endTime);
                        var oldDefaultTimeMoment = moment(this.shifts[i].defaultTime);

                        newStartTimeMoment.hour(oldStartTimeMoment.hour()).minute(oldStartTimeMoment.minute());
                        newEndTimeMoment.hour(oldEndTimeMoment.hour()).minute(oldEndTimeMoment.minute());
                        newDefaultTimeMoment.hour(oldDefaultTimeMoment.hour()).minute(oldDefaultTimeMoment.minute());


                        this.shifts[i].startTime = newStartTimeMoment.format(FullDateFormat);
                        this.shifts[i].endTime = newEndTimeMoment.format(FullDateFormat);
                        this.shifts[i].defaultTime = newDefaultTimeMoment.format(FullDateFormat);

                    }
                }

                return this;
            }
            if(angular.isNumber(dayOfWeek) && dayOfWeek <= 6){
                var dayOfWeek = dayOfWeek;
                this.date = new Date(moment().day(dayOfWeek));
                this.shifts = Shifts.basicShifts(dayOfWeek);

                this.shifts.$getRef().once('value', function(snapshot){
                    if(!snapshot.val()){
                        self.generateDefaultShifts();
                    }
                });

                return this;
            }

            throw new Error('Please provide a valid day of week or data');
        }


        BasicShiftDay.prototype.save = function(){
            var defer = $q.defer();
            var self = this;
            this.shifts.$on('value', function(){
                self.shifts.$off('value');
                defer.resolve()
            });

            this.shifts.$save();
            return defer.promise;
        }


        BasicShiftDay.prototype.generateDefaultShifts = function(){

            this.shifts.date = this.date;
            this.shifts.basic = true;
            this.shifts.shifts = [];
            for(var i in ShiftsNames){
                this.shifts.shifts[i] = Shift.defaultShiftForShiftIndex(i, null, true);
            }
        }

        BasicShiftDay.prototype.wasChanged = function(){
            return this.save();
        }


        return BasicShiftDay;
    })
    .factory('Shift', function(ShiftsNames){
        function Shift(_shift, startTime, endTime, defaultTime, index, active){
            if(_shift && _shift.startTime && _shift.endTime && _shift.index){
                angular.extend(this, _shift);
                if(!this.defaultTime) this.defaultTime = this.startTime;
            } else if(startTime && endTime && index){
               this.startTime = new Date(startTime);
               this.endTime = new Date(endTime);
               this.defaultTime = new Date(defaultTime) || this.startTime;
               this.name = ShiftsNames[index].name;
               this.active = active;
            }else{
                throw new Error('Please provide valid shift index, start date and end date');
            }
            return this;
        };

        Shift.prototype.startTimeHour = function(){
            return moment(this.startTime).format('hh:mm');
        }


        Shift.defaultShiftForShiftIndex = function(index, date, active){
            if(!index){
                throw new Error('Please provide a shift name');
            }
            var dateMoment = date ? moment(date) : moment(),
                dayOfYear = dateMoment.dayOfYear(),
                startTime,
                endTime,
                defaultTime,
                shiftConfig = ShiftsNames[index];


            if(!shiftConfig){
                throw new Error('Please provide a valid shift name');
            }

            var dayOfYear = dateMoment.dayOfYear();
            var year = dateMoment.year();
            startTime = shiftConfig.defaultStartTime.dayOfYear(dayOfYear).year(year);
            defaultTime = startTime;
            endTime = shiftConfig.defaultEndTime.dayOfYear(dayOfYear).year(year);

            defaultTime = startTime;
            return new Shift(null,startTime, endTime, defaultTime, index, active);
        }
        return Shift;
    })
    .filter('activeShift', function(){
        return function(shiftsArr){
            if(!shiftsArr) return null;
            var tempShift, output = [];
            for(var i in shiftsArr){
                tempShift = shiftsArr[i];
                if(tempShift.active){
                    output.push(tempShift);
                }
            }
            return output;
        }
    })