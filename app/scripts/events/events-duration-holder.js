var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('EventsDurationHolder', function($rootScope,BusinessHolder){
        var $eventsDurations = BusinessHolder.$business.$child('eventsDuration');
        var updateEvents = function(){
            if(BusinessHolder.$business){
                $eventsDurations = BusinessHolder.$business.$child('eventsDuration');
            }
        };

        $rootScope.$on('$businessHolderChanged', updateEvents);


        return $eventsDurations;

    }).factory('EventsDurationForGuestsHolder', function($rootScope,BusinessHolder){
        var $eventsDurationsForGuests = BusinessHolder.$business.$child('eventsDurationForGuests');
        var updateEvents = function(){
            if(BusinessHolder.$business){
                $eventsDurationsForGuests = BusinessHolder.$business.$child('eventsDurationForGuests');
            }
        };

        $rootScope.$on('$businessHolderChanged', updateEvents);


        return $eventsDurationsForGuests;

    })