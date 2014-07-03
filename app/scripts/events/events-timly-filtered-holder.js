var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('TimelyFilteredEvents', function($rootScope,DateHolder, EventsHolder,$filter, ShiftsDayHolder){

        var _holder = {};

        $rootScope.$watch(function(){
            return DateHolder;
        }, function(newVal){
            var current = newVal.current;
            var isEntireShift = newVal.isEntireShift;
            if(isEntireShift){
                _holder.filteredEvents = $filter('eventsByEntireShift')(EventsHolder.today,ShiftsDayHolder.selected);
            }else{
                if(angular.isDate(current)){
                    _holder.filteredEvents = $filter('eventsByTime')(EventsHolder.today);
                }else{

                }
            }
        },true);

        return _holder;
    })