var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('EventsHolder', function($rootScope,BusinessHolder, DateHolder, Event, $log){
        var $events = {$allEvents : null};
        var updateEvents = function(){
            if(BusinessHolder.$business){
                $events.$allEvents = BusinessHolder.$business.$child('events');
                $log.info ('[EventsHolder] Update events');
            }
        };

        $rootScope.$on('$businessHolderChanged', updateEvents);
        updateEvents();
//        $rootScope.$watch(function(){
//            return DateHolder.current;
//        }, updateEvents);


        return $events;

    });