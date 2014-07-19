var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('EventsHolder', function($rootScope,BusinessHolder, DateHolder, Event){
        var $events = {$allEvents : null};
        var updateEvents = function(){
            if(BusinessHolder.$business){
                $events.$allEvents = BusinessHolder.$business.$child('events');
            }
        };

        $rootScope.$on('$businessHolderChanged', updateEvents);
        updateEvents();
//        $rootScope.$watch(function(){
//            return DateHolder.current;
//        }, updateEvents);


        return $events;

    });