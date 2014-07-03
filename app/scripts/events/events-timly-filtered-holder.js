var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('TimelyFilteredEvents', function($rootScope,DateHolder, EventsHolder,$filter, ShiftsDayHolder){

        var _holder = {};


        var filterEvents = function(){
            console.log('filterEvents');
            var current = DateHolder.current;
            var isEntireShift = DateHolder.isEntireShift;
            if(isEntireShift){
                _holder.filteredEvents = $filter('eventsByEntireShift')(EventsHolder.today,ShiftsDayHolder.selected);
            }else{
                if(angular.isDate(current)){
                    _holder.filteredEvents = $filter('eventsByTime')(EventsHolder.today);
                }else{

                }
            }
        };

        $rootScope.$watch(function(){
            return DateHolder;
        }, filterEvents ,true);

        $rootScope.$watch(function(){
            return EventsHolder.today;
        }, filterEvents ,true);


        return _holder;
    })