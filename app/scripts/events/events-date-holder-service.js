var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('DateHolder', function($rootScope){
        var _date = {};

        var now = moment();

        if(now.hour() < 4){
            _date.current = new Date(now.subtract('days',1).hour(23).minute(0));
        }else{
            _date.current = new Date();
        }

        return _date;
    });