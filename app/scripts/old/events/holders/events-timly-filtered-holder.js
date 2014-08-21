var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('TimelyFilteredEvents', function($rootScope,DateHolder, EventsHolder,$filter, ShiftsDayHolder){

        var _holder = {};


        var filterEvents = function(){
            var current = DateHolder.currentClock;
            var isEntireShift = DateHolder.isEntireShift;

            _holder.filteredEventsByShift = $filter('eventsByEntireShift')(EventsHolder.$allEvents,ShiftsDayHolder.selected);


            if(isEntireShift){
                _holder.filteredEvents = _holder.filteredEventsByShift;
            }else{
                if(angular.isDate(current)){
                    var eventsByTime =  $filter('eventsByTime')(EventsHolder.$allEvents);
                    _holder.filteredEvents = eventsByTime.filteredEvents;
                    _holder.upcomingEvents = eventsByTime.upcomingEvents;

                }else{

                }
            }
        };

        $rootScope.$watch(function(){
            return DateHolder;
        }, filterEvents, true);

        $rootScope.$watch(function(){
            return EventsHolder.$allEvents;
        }, filterEvents, true);

        $rootScope.$watch(function(){
            return ShiftsDayHolder.selected;
        }, filterEvents,true);



        return _holder;
    })