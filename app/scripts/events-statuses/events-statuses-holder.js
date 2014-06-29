var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('EventsStatusesHolder', function($rootScope, BusinessHolder){
        var $eventsStatuses = BusinessHolder.$business.$child('eventsStatuses');
        $rootScope.$on('$businessHolderChanged', function(){
            $eventsStatuses = BusinessHolder.$business.$child('eventsStatuses');
        });

        return $eventsStatuses;
    });