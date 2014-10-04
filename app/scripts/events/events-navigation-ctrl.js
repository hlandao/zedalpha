//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('EventsNavigationCtrl', function($scope, DateHolder, EventsCollection, ShiftsDayHolder, DeadEventsStatuses){

        var countAll = function(){
            if(!EventsCollection.collection || !EventsCollection.collection.length || !ShiftsDayHolder.currentDay) return;
            var totalOrdersCount = 0, totalGuestsCount = 0, guestsLeftCount = 0, totalWalkinsCount= 0;
            var currentEvent, eventGuests, key;
            for (var i = 0; i < EventsCollection.collection.length; ++i){
                key = EventsCollection.collection.$keyAt(i);
                currentEvent = EventsCollection.collection.$getRecord(key);

                if(!ShiftsDayHolder.selectedShift.call(ShiftsDayHolder.selectedShift,currentEvent)){
                  continue;
                }
                eventGuests = currentEvent.data.guests ? parseInt(currentEvent.data.guests) : 0;
                // Total orders count
                if(!currentEvent.data.isOccasional && !currentEvent.$isDeadEvent()){
                    ++totalOrdersCount;
                    totalGuestsCount += eventGuests;
//                    if(event.status && (event.status.ORDERED || event.status.CONFIRMED)){
//                        guestsLeftCount += eventGuests
//                    }
                }else if(currentEvent.data.isOccasional){
                    // Total walkins count
                    totalWalkinsCount += eventGuests;
                }
            }


            $scope.totalGuestsCount = totalGuestsCount;
//            $scope.totalGuestsLeft = guestsLeftCount;
            $scope.totalWalkinsCount = totalWalkinsCount;
            $scope.totalOrdersCount = totalOrdersCount;

        };

        $scope.$watch(function(){
            return EventsCollection.collection;
        },countAll);

        $scope.$watch(function(){
            return EventsCollection.collection && EventsCollection.collection.length;
        },countAll);


        $scope.$watch(function(){
            return ShiftsDayHolder.selectedShift;
        },countAll);


    });