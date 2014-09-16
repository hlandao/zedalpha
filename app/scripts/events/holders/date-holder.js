var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .service('DateHolder', function($rootScope, DateHelpers){

        var self = this,
            clockInitialized = false,
            dateInitialized = false;

        this.changedByUser = false;

        this.goToNow = function(init){
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
            if(!init) self.changedByUser = true;
        }

        this.goToClock = function(clock){
            if(DateHelpers.isMomentValid(clock)){
                if(!DateHelpers.isMomentSameDate(clock, self.currentDate)){
                    self.currentDate = clock.clone().hour(0).minute(0);
                }
                self.currentClock = clock.clone();
            }
            self.changedByUser = true;
        }

        this.goToDate = function(date){
            if(DateHelpers.isMomentValid(date)){
                var newClock = date.clone().hour(self.currentClock.hour()).minute(self.currentClock.minute()).seconds(0);
                self.currentClock = newClock;
                self.currentDate = date.hour(0).minute(0);
            }
            self.changedByUser = true;
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
        }, function(newVal, oldVal){
            if(!dateInitialized || !newVal){
                dateInitialized = true;
                return;
            }

            if(!self.changedByUser){
                if(self.currentClock){
                    if(self.currentClock.hour() < 6 && self.currentClock.diff(self.currentDate, 'days') === 1){
                    }else{
                        self.currentClock = self.currentDate.clone().hour(self.currentClock.hour()).minute(self.currentClock.minute());
                    }
                }else{
                    self.currentClock = self.currentDate.clone();
                }
            }

            self.changedByUser = false;
            $rootScope.$emit('$dateWasChanged');
        }, true);

        this.goToNow(true);
    });

