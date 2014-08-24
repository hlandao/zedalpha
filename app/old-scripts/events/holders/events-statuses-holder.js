var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('EventsStatusesHolder', function($rootScope, BusinessHolder){
        var $eventsStatuses;

        var update = function(){
            $eventsStatuses = BusinessHolder.$business.$child('eventsStatuses');
        }

        if(BusinessHolder.$business) update();
        $rootScope.$on('$businessHolderChanged', function(){
            $eventsStatuses = BusinessHolder.$business.$child('eventsStatuses');
        });

        return $eventsStatuses;
    });