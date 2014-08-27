var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('DateHolder', function($rootScope, DateHelpers){
        var _date = {};

        var goToNow = function(init){
            var now = moment(), newDateMoment;

            if(init && now.hour() < 6){
                newDateMoment = now.subtract('days',1).hour(23).minute(0);
            }else{
                newDateMoment = now;
            }

            newDateMoment.minute(DateHelpers.findClosestIntervalToDate(newDateMoment)).seconds(0);


            _date.currentClock = newDateMoment;
            _date.currentDate = newDateMoment.clone().hour(0).minute(0);

            newDateMoment = null;
        }



        _date.goToNow = goToNow;
        goToNow(true);

        $rootScope.$watch(function(){
            return _date.currentClock
        }, function(newVal){
            if(!newVal.isValid || !newVal.isValid()){
                _date.currentClock = moment(_date.currentClock);
            }
            $rootScope.$emit('$clockWasChanged');
        }, true);

        $rootScope.$watch(function(){
            return _date.currentDate
        }, function(newVal){
            if(!newVal.isValid || !newVal.isValid()){
                _date.currentDate = moment(_date.currentDate);
            }

            if(_date.currentClock){
                _date.currentClock = _date.currentDate.clone().hour(_date.currentClock.hour()).minute(_date.currentClock.minute());
            }else{
                _date.currentClock = _date.currentDate.clone();
            }

            $rootScope.$emit('$dateWasChanged');
        }, true);


        return _date;
    });