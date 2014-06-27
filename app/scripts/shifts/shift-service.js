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
            if(angular.isNumber(weekNumber)){
                var dateMoment = moment().weekYear(weekNumber).day(0);
                while(dateMoment.day() < 7){
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
            var day,
                promises = [];

            for (var i = 0; i < this.days.length; ++i){
                day = this.days[i];
                if(day.save) promises.push(day.save());
            }

            return $q.all(promises);
        }

        return ShiftsWeek;
    })
    .factory('ShiftDay', function(Shifts, Shift, ShiftsNames, BusinessHolder){
        function ShiftDay(date, active, shiftData){
            if(shiftData){
                angular.extend(this, shiftData);
                return this;
            }
            if(date){
                this.date = date ? new Date(date) : new Date();
                this.dayOfWeek = moment(this.date).dayOfWeek();
                this.dayOfYear = moment(this.date).dayOfYear();
                this.shifts = Shifts.shiftsWithDayOfYear(this.dayOfYear);
                if(!this.shifts.$value){
                    this.generateDefaultShifts();
                }
                return this;
            }
            throw new Error('Please provide a valid date');

        }

        ShiftDay.prototype.save = function(){
            var defer = $q.defer();
            var self = this;
            this.shifts.$on('value', function(){
                self.shifts.$off('value');
                defer.resolve();
            });

            this.shifts.$save();
            return defer.promise;
        }


        ShiftDay.prototype.generateDefaultShifts = function(){
            for(var i in ShiftsNames){
                this.shifts[i] = Shift.defaultShiftForShiftIndex(i, null, true, false);
            }
        }


        return ShiftDay;
    })
    .factory('BasicShiftDay', function($rootScope, Shifts, ShiftDay, Shift, ShiftsNames, BusinessHolder,$q, $timeout){
        function BasicShiftDay(dayOfWeek, data){
            var self = this;

            if(data){
                angular.extend(this, data);
                return this;
            }
            if(angular.isNumber(dayOfWeek) && dayOfWeek <= 6){
                var dayOfWeek = dayOfWeek;
                this.date = new Date(moment().day(dayOfWeek));
                this.shifts = Shifts.basicShifts(dayOfWeek);
                console.log('this.shifts',this.shifts);

                this.shifts.$getRef().on('value', function(snapshot){
                    if(!snapshot.val()){
                        console.log('here');
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

            for(var i in ShiftsNames){
                this.shifts.date = this.date;
                this.shifts.active = true;
                this.shifts.basic = true;
                this.shifts[i] = Shift.defaultShiftForShiftIndex(i, null, true);
            }
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
    });