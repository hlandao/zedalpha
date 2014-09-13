var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .service('DateHolder', function($rootScope, DateHelpers){

        var self = this,
            clockInitialized = false,
            dateInitialized = false;
        this.goToNow = function(init){
            console.log('goToNow');
            var now = moment(), newDateMoment, updateOnlyClock, currentDate;

            if(init && now.hour() < 6){
                newDateMoment = now.subtract('days',1).hour(23).minute(0);
                currentDate = newDateMoment.clone().hour(0).minute(0);
            }else if(!init && now.hour() < 6){
                newDateMoment = now;
                currentDate = newDateMoment.clone().hour(0).minute(0).subtract('days',1);
            }else{
                newDateMoment = now;
                currentDate = newDateMoment.clone().hour(0).minute(0);
            }

            newDateMoment.minute(DateHelpers.findClosestIntervalToDate(newDateMoment)).seconds(0);


            this.currentClock = newDateMoment;
            if(updateOnlyClock) return;
            this.currentDate = currentDate;
        }

        this.goToClock = function(clock){
            if(DateHelpers.isMomentValid(clock)){
                if(!DateHelpers.isMomentSameDate(clock, self.currentDate)){
                    self.currentDate = clock.clone().hour(0).minute(0);
                }
                self.currentClock = clock.clone();
            }
        }

        this.goToDate = function(date){
            if(DateHelpers.isMomentValid(date)){
                var newClock = date.clone().hour(self.currentClock.hour()).minute(self.currentClock.minute()).seconds(0);
                self.currentClock = newClock;
                self.currentDate = date.hour(0).minute(0);
            }
        }


        $rootScope.$watch(function(){
            return self.currentClock;
        }, function(newVal, oldVal){
            if(!clockInitialized || !newVal){
                clockInitialized = true;
                return;
            }
            $rootScope.$emit('$clockWasChanged');
        });


        $rootScope.$watch(function(){
            return self.currentDate;
        }, function(newVal){
            if(!dateInitialized || !newVal){
                dateInitialized = true;
                return;
            }

            if(self.currentClock){
                self.currentClock = self.currentDate.clone().hour(self.currentClock.hour()).minute(self.currentClock.minute());
            }else{
                self.currentClock = self.currentDate.clone();
            }
            $rootScope.$emit('$dateWasChanged');
        }, true);

        this.goToNow(true);
    });