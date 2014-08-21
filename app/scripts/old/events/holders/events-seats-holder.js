

var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('EventsSeatsHolder', function($rootScope, BusinessHolder){

        var $seats = {};

        var update = function(){
            var $mapRef = BusinessHolder.$business.$child('map').$on('loaded', function(){
                $mapRef.$off('loaded');
                if($mapRef.$value){
                    $seats.seats = extractSeatsFromMap($mapRef.$value);
                }
            });
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

        if(BusinessHolder.$business) update();

        $rootScope.$on('$businessHolderChanged', function(){
           update();
        });

        return $seats;
    });

