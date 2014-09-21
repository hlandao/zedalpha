

var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .service('SeatsHolder', function($rootScope, BusinessHolder){

        var self = this;


        self.seatingOptionsForSeats = function(seatsObject){
            var output = {}
            for(var i in seatsObject){
                var seat = self.seats[i];
                if(seat){
                    angular.extend(output, seat.seatingOptions);
                }

            }
            return output;
        }


        var update = function(){
            var map = BusinessHolder.business.map;
                if(map){
                    self.seats = extractSeatsFromMap(map);
                }
        };

        var extractSeatsFromMap = function(mapJSON){
            var map = JSON.parse(mapJSON), output = {};
            angular.forEach(map, function(element){
                var data = element.data;
                if(data && data.seatId){
                    output[data.seatNumber] = output[data.seatNumber] || {};

                    angular.extend(output[data.seatNumber], {
                        seatId : data.seatId
                    });


                    if(data.seatingOptions){
                        output[data.seatNumber].seatingOptions = data.seatingOptions
                    }
                }
            });


            return output;
        };

        if(BusinessHolder.business){
            update();
        }
        $rootScope.$on('$businessHolderChanged', function(){
           update();
        });

    });

