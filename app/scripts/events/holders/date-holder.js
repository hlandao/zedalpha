var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .service('DateHolder', function($rootScope, DateHelpers){

        var self = this,
            clockInitialized = false,
            dateInitialized = false;
        this.goToNow = function(init){

            var now = moment(), newDateMoment;

            if(init && now.hour() < 6){
                newDateMoment = now.subtract('days',1).hour(23).minute(0);
            }else{
                newDateMoment = now;
            }

            newDateMoment.minute(DateHelpers.findClosestIntervalToDate(newDateMoment)).seconds(0);


            this.currentClock = newDateMoment;
            this.currentDate = newDateMoment.clone().hour(0).minute(0);
            $rootScope.$emit('$dateWasChanged');
            $rootScope.$emit('$clockWasChanged');

        }

        $rootScope.$watch(function(){
            return self.currentClock;
        }, function(newVal, oldVal){
            if(!clockInitialized){
                clockInitialized = true;
                return;
            }
            $rootScope.$emit('$clockWasChanged');
        });


        $rootScope.$watch(function(){
            return self.currentDate;
        }, function(newVal){
            if(!dateInitialized){
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