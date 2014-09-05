//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('EventsDurationCtrl', function($scope,BusinessMetaData, BusinessHolder, Alert){

        // get business meta data
        $scope.businessMetaData = BusinessMetaData;
        // check if ID is available
        // get business data from business holder
        $scope.business = BusinessHolder.business;
        debugger;
        console.log('$scope.business',$scope.business);

        $scope.msg = new Alert(4000);

        $scope.addDuration = function(newDuration){
            $scope.err = null;
            $scope.msg.setMsg('');
            newDuration = parseInt(newDuration);
            $scope.err = null;
            $scope.msg.setMsg('');
            if(!newDuration || !angular.isNumber(newDuration)){
                $scope.err = "Please enter duration as a number";
                return;
            }
            $scope.business.eventsDuration = $scope.business.eventsDuration || {};
            $scope.business.eventsDuration[newDuration] = true;
            $scope.business.$save().then(function(){
                $scope.msg.setMsg('Saved!');
            });
        };

        $scope.removeDuration = function(duration){
            $scope.err = null;
            $scope.msg.setMsg('');
            if(duration){
                $scope.business.eventsDuration = $scope.business.eventsDuration || {};
                $scope.business.eventsDuration[duration] = null;
                return $scope.business.$save().then(function(){
                    $scope.msg.setMsg('Duration was Removed!');
                });
            }
            $scope.err = "Error!"
        };

        $scope.addDurationForGuests = function(newDurationForGuests){
            $scope.err = null;
            $scope.msg.setMsg('');
            if(!newDurationForGuests || !newDurationForGuests.guests || !newDurationForGuests.duration){
                return $scope.err = "Please enter duration as a number";
            }
            if(!$scope.business.eventsDurationForGuests){
                $scope.business.eventsDurationForGuests = $scope.business.eventsDurationForGuests = {};
            }
            $scope.business.eventsDurationForGuests[newDurationForGuests.guests] = newDurationForGuests.duration;
            return $scope.business.$save().then(function(){
                $scope.msg.setMsg('Saved!');
            });
        };

        $scope.removeDurationForGuests = function(key){
            if(key){
                $scope.business.eventsDurationForGuests[key] = null;
                return $scope.business.$save().then(function(){
                    $scope.msg.setMsg('Duration for guests was Removed!');
                });
            }
            $scope.err = "Error!"
        };

        $scope.saveGuestsPer15 = function(){
            return $scope.business.$save().then(function(){
                $scope.msg.setMsg('Guests per 15 minutes was saved!');
            });
        };


    });