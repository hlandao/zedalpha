

var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('EventsSeatsHolder', function($rootScope, BusinessHolder){

        var _seats = {};

        var update = function(){
            var map = BusinessHolder.business.map;
                if(map){
                    _seats.seats = extractSeatsFromMap(map);
                }
        };

        var extractSeatsFromMap = function(mapJSON){
            var map = JSON.parse(mapJSON), output = {};
            angular.forEach(map, function(element){
                var data = element.data;
                if(data && data.seatId){
                    output[data.seatNumber] = data.seatId;
                }
            });

            return output;
        };

        if(BusinessHolder.business) update();

        $rootScope.$on('$businessHolderChanged', function(){
           update();
        });

        return _seats;
    });

