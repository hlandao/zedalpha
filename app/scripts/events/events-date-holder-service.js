var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('DateHolder', function($rootScope, DateHelpers){
        var _date = {};

        var now = moment(), newDate;

        if(now.hour() < 6){
            newDate = new Date(now.subtract('days',1).hour(23).minute(0));
        }else{
            newDate = new Date();
        }

        newDate = new Date(moment(newDate).minute(DateHelpers.findClosestIntervalToDate(newDate)));

        _date.current = newDate;

        return _date;
    });