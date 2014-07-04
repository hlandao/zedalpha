var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('TimelyFilteredEvents', function($rootScope,DateHolder, EventsHolder,$filter, ShiftsDayHolder){

        var _holder = {};


        var filterEvents = function(){
            var current = DateHolder.current;
            var isEntireShift = DateHolder.isEntireShift;

            _holder.filteredEventsByShift = $filter('eventsByEntireShift')(EventsHolder.today,ShiftsDayHolder.selected);


            if(isEntireShift){
                _holder.filteredEvents = _holder.filteredEventsByShift;
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

        $rootScope.$watch(function(){
            return ShiftsDayHolder.selected;
        }, filterEvents ,true);



        return _holder;
    })