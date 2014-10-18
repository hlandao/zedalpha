var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .service("EventsHelpers", function ($rootScope, $log, $filter, BusinessHolder, EventsCollection, DateHolder, ShiftsDayHolder, Event, $q, StatusFilters, DateFormatFirebase, DateHelpers, $timeout, EventsNotificationsHolder) {
        var self = this;

        this.init = function(){
            $log.debug('[EventsHelpers] init');
            var nowClock = getNowClock();
            DateHolder.goToClock(nowClock);
            ShiftsDayHolder.loadWithDate(DateHolder.currentDate, {
                selectShiftByClock : true,
                clock : DateHolder.currentClock});
            EventsCollection.loadEventsForDate(BusinessHolder.business.$id, DateHolder.currentDate, DateHolder.currentClock);

        }

        this.userChooseDate = function(date){
            $log.debug('[EventsHelpers] userChooseDate. Date :',date);
            DateHolder.goToDate(date);
            ShiftsDayHolder.loadWithDate(DateHolder.currentDate, {
                selectShiftByClock : true,
                clock : DateHolder.currentClock});
            EventsCollection.loadEventsForDate(BusinessHolder.business.$id, DateHolder.currentDate, DateHolder.currentClock);
        }

        this.userChooseClock = function(clock){
            $log.debug('[EventsHelpers] userChooseClock. Clock :',clock);
            DateHolder.goToClock(clock);
            ShiftsDayHolder.loadWithDate(DateHolder.currentDate, {
                selectShiftByClock : true,
                clock : DateHolder.currentClock});
            EventsCollection.sortEvents({clock : DateHolder.currentClock});
        }

        this.userChooseShift = function(shift){
            $log.debug('[EventsHelpers] userChooseShift. Shift :',shift);
            ShiftsDayHolder.selectedShift = shift;
            $log.info('[EventsHelpers] User selected new shift : ', shift.name);
            DateHolder.goToClock(shift.defaultTime || shift.startTime);
            EventsCollection.sortEvents({clock : DateHolder.currentClock});
        }


        this.userChooseFilters = function(filters){
            EventsCollection.sortEvents(angular.extend({
                clock : DateHolder.currentClock
            }, filters));
        }

        var getNowClock = function(){
            return moment();
        }
    });
