var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('TimelyFilteredEvents', function($rootScope,DateHolder, EventsHolder,$filter){

        var _holder = {};

        $rootScope.$watch(function(){
            return DateHolder.current;
        }, function(newVal){
            console.log('newVal',newVal,angular.isDate(newVal));
            if(angular.isDate(newVal)){
                _holder.filteredEvents = $filter('eventsByTime')(EventsHolder.today);
                console.log('_holder.filteredEvents',_holder.filteredEvents);
            }else{

            }
        });

        return _holder;
    })