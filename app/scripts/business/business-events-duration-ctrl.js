//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('EventsDurationCtrl', function($scope,BusinessMetaData, BusinessHolder, Alert){

        // get business meta data
        $scope.businessMetaData = BusinessMetaData;
        // check if ID is available
        // get business data from business holder
        $scope.business = BusinessHolder.$business;
        $scope.businessId = BusinessHolder.businessId;
        $scope.eventsDuration = $scope.business.$child('eventsDuration');
        $scope.eventsDurationForGuests = $scope.business.$child('eventsDurationForGuests');
        $scope.guestsPer15 = $scope.business.$child('guestsPer15');



        $scope.msg = new Alert(4000);

        $scope.addDuration = function(newDuration){
            newDuration = parseInt(newDuration);
            $scope.err = null;
            $scope.msg.setMsg('');
            if(!newDuration || !angular.isNumber(newDuration)){
                $scope.err = "Please enter duration as a number";
                return;
            }
            $scope.eventsDuration.$child(newDuration).$set(true);
            newDuration = 0;
            $scope.msg.setMsg('Saved!');
        };

        $scope.removeDuration = function(duration){
            if(duration){
                var $duration = $scope.eventsDuration.$child(duration);
                if($duration){
                    $duration.$remove();
                    return $scope.msg.setMsg('Duration was Removed!');
                }
            }
            $scope.err = "Error!"
        };

        $scope.addDurationForGuests = function(newDurationForGuests){
            $scope.err = null;
            $scope.msg.setMsg('');
            if(!newDurationForGuests || !newDurationForGuests.guests || !newDurationForGuests.duration){
                $scope.err = "Please enter duration as a number";
                return;
            }
            $scope.eventsDurationForGuests.$add(newDurationForGuests);
            newDurationForGuests = {};
            $scope.msg.setMsg('Saved!');
        };

        $scope.removeDurationForGuests = function(key){
            if(key){
                var $durationForGuests = $scope.eventsDurationForGuests.$child(key);
                if($durationForGuests){
                    $durationForGuests.$remove();
                    return $scope.msg.setMsg('Duration for guests was Removed!');
                }
            }
            $scope.err = "Error!"
        };

        $scope.saveGuestsPer15 = function(){
            $scope.guestsPer15.$set($scope.guestsPer15.$value);
            console.log('$scope.guestsPer15',$scope.guestsPer15);
            $scope.msg.setMsg('Saved!');
        };


    });