var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('DateHolder', function(){
        var _date = {};

        _date.current = new Date();

        return _date;
    })