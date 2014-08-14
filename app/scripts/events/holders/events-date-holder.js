var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('DateHolder', function($rootScope, DateHelpers){
        var _date = {};

        var goToNow = function(){
            var now = moment(), newDateMoment;

            if(now.hour() < 6){
                newDateMoment = now.subtract('days',1).hour(23).minute(0);
            }else{
                newDateMoment = moment();
            }

            newDateMoment.minute(DateHelpers.findClosestIntervalToDate(newDateMoment)).seconds(0);


            _date.currentClock = new Date(newDateMoment);
            _date.currentDate = new Date(newDateMoment.hour(0).minute(0));

            newDateMoment = null;
        }



        _date.goToNow = goToNow;
        goToNow();

        return _date;
    });