//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('EventsNavigationCtrl', function($scope){
        $scope.openDatePicker = function(e){
            e.preventDefault();
            e.stopPropagation();
            $scope.datePickerOpened = true;
        }

//        $scope.$watch(function(){
//            return TimelyFilteredEvents.filteredEventsByShift
//        }, function(){
//            countAll();
//        },true);

        var countAll = function(){
            var totalOrdersCount = 0, totalGuestsCount = 0, guestsLeftCount = 0, totalWalkinsCount= 0;
            var event, eventGuests;
            for (var i = 0; i < TimelyFilteredEvents.filteredEventsByShift.length; ++i){
                var event = TimelyFilteredEvents.filteredEventsByShift[i];
                eventGuests = event.guests ? parseInt(event.guests) : 0;
                // Total orders count
                if(!event.isOccasional){
                    ++totalOrdersCount;
                    totalGuestsCount += eventGuests;
                    if(event.status && (event.status.ORDERED || event.status.CONFIRMED)){
                        guestsLeftCount += eventGuests
                    }
                }else{
                    // Total walkins count
                    totalWalkinsCount += eventGuests;
                }
            }

            $scope.totalGuestsCount = totalGuestsCount;
            $scope.totalGuestsLeft = guestsLeftCount;
            $scope.totalWalkinsCount = totalWalkinsCount;
            $scope.totalOrdersCount = totalOrdersCount;

        };

    });