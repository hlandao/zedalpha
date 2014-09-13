var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .service('DateHolder', function($rootScope, DateHelpers){

        var self = this,
            clockInitialized = false,
            dateInitialized = false;
        this.goToNow = function(init){
            console.log('goToNow');
            var now = moment(), newDateMoment, updateOnlyClock;

            if(init && now.hour() < 6){
                newDateMoment = now.subtract('days',1).hour(23).minute(0);
            }else if(!init && now.hour() < 6){
                updateOnlyClock = true;
                newDateMoment = now;
            }else{
                newDateMoment = now;
            }

            newDateMoment.minute(DateHelpers.findClosestIntervalToDate(newDateMoment)).seconds(0);


            this.currentClock = newDateMoment;
            if(!updateOnlyClock){
                var currentDate = newDateMoment.clone().hour(0).minute(0);
                this.currentDate = currentDate;
            }
            debugger;

        }

        this.goTo = function(date, clock){
//            if(DateHelpers.isMomentValid(date)){
//
//            }else if(DateHelpers.isMomentValid(clock)){
//                if(goToMoment.isSame(self.currentDate, 'day')){
//
//                }
//                self.currentClock = goToMoment.clone();
//            }
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