var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .service('DateHolder', function($rootScope, DateHelpers, DateFormatFirebase){

        function DateHolderException(message) {
            this.name = 'DateHolderException';
            this.message= message;
        }
        DateHolderException.prototype = new Error();
        DateHolderException.prototype.constructor = DateHolderException;


        var self = this,
            clockInitialized = false,
            dateInitialized = false;

        this.goToNow = function(init){
            var now = moment().seconds(0), newClockMoment, newDateMoment;

            if(init && isClockBelongToPreviousDay(now)){
                newClockMoment = now.subtract('days',1).hour(23).minute(0);
                newDateMoment = newClockMoment.clone().hour(0).minute(0);
            }else if(!init && isClockBelongToPreviousDay(now)){
                newClockMoment = now;
                newDateMoment = newClockMoment.clone().hour(0).minute(0).subtract('days',1);
            }else{
                newClockMoment = now;
                newDateMoment = newClockMoment.clone().hour(0).minute(0);
            }

            newClockMoment.minute(DateHelpers.findClosestIntervalToDate(newClockMoment)).seconds(0);

            self.currentClock = newClockMoment;
            if(!DateHelpers.isMomentSameDate(newDateMoment,self.currentDate)){
                self.currentDate = newDateMoment;
            }
        }


        this.goToEvent = function(event){
            if(!event || event.constructor.name != "Event"){
                throw new DateHolderException("'goToEvent failed'. Please provide a valid Event object");
            }else{
                if(event.data.baseDate != self.currentDate.format(DateFormatFirebase)){
                    self.currentDate = moment(event.data.baseDate, DateFormatFirebase).seconds(0);
                }
                self.currentClock = event.data.startTime.clone().seconds(0);
            }
        }

        var areClockAndDateSameDate = function(){
            if(isClockBelongToPreviousDay()){
                return (self.currentClock.diff(self.currentDate, 'day') == 1);
            }else{
                return self.currentClock.isSame(self.currentDate, 'day');
            }
        }

        var isClockBelongToPreviousDay = function(clock){
            clock = clock || self.currentClock;
            return (clock.hour < 6 && clock >= 0);
        }

        $rootScope.$watch(function(){
            return self.currentClock;
        }, function(newVal, oldVal){
            if(newVal){
                newVal.seconds(0);
                $rootScope.$emit('$clockWasChanged');
            }
        });


        $rootScope.$watch(function(){
            return self.currentDate;
        }, function(newVal, oldVal){
//            if(!dateInitialized || !newVal){
//                dateInitialized = true;
//                return;
//            }

            newVal.seconds(0);

            if(!areClockAndDateSameDate()){
                var hour = self.currentClock.hour();
                var minute = self.currentClock.minute();
                if(isClockBelongToPreviousDay()){
                    self.currentClock = self.currentDate.clone().add(1,'days').minute(minute).hour(hour);
                }else{
                    self.currentClock = self.currentDate.clone().minute(minute).hour(hour);
                }
            }

            $rootScope.$emit('$dateWasChanged');
        }, true);

        this.goToNow(true);
    });

