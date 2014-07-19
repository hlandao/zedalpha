var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('EventsDurationHolder', function($rootScope,BusinessHolder){
        var $eventsDurations;
        var updateEvents = function(){
            if(BusinessHolder.$business){
                $eventsDurations = BusinessHolder.$business.$child('eventsDuration');
            }
        };

        if(BusinessHolder.$business) updateEvents();
        $rootScope.$on('$businessHolderChanged', updateEvents);


        return $eventsDurations;

    }).factory('EventsDurationForGuestsHolder', function($rootScope,BusinessHolder){
        var $eventsDurationsForGuests;
        var updateEvents = function(){
            if(BusinessHolder.$business){
                $eventsDurationsForGuests = BusinessHolder.$business.$child('eventsDurationForGuests');
            }
        };

        if(BusinessHolder.$business) updateEvents();
        $rootScope.$on('$businessHolderChanged', updateEvents);

        return $eventsDurationsForGuests;

    })