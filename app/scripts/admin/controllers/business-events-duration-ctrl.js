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

        $scope.msg = new Alert(4000);

        $scope.addDuration = function(newDuration){
            newDuration = parseInt(newDuration);
            if(!newDuration || !angular.isNumber(newDuration)){
                toastr.options = {
                    "closeButton": true,
                    "positionClass": "toast-bottom-right",
                    "timeOut": "3000"
                };
                toastr.error("Please enter duration as a number")
                return;
            }
            $scope.business.eventsDuration = $scope.business.eventsDuration || {};
            $scope.business.eventsDuration[newDuration] = true;
            $scope.business.$save().then(function(){
                toastr.options = {
                    "closeButton": true,
                    "positionClass": "toast-bottom-right",
                    "timeOut": "3000"
                };
                toastr.success("Saved!")
            });
        };

        $scope.removeDuration = function(duration){
            if(duration){
                $scope.business.eventsDuration = $scope.business.eventsDuration || {};
                $scope.business.eventsDuration[duration] = null;
                return $scope.business.$save().then(function(){
                    toastr.options = {
                        "closeButton": true,
                        "positionClass": "toast-bottom-right",
                        "timeOut": "3000"
                    };
                    toastr.success("Duration was Removed!")

                });
            }
            toastr.options = {
                "closeButton": true,
                "positionClass": "toast-bottom-right",
                "timeOut": "3000"
            };
            toastr.error("Error!")
        };

        $scope.addDurationForGuests = function(newDurationForGuests){
            if(!newDurationForGuests || !newDurationForGuests.guests || !newDurationForGuests.duration){
                toastr.options = {
                    "closeButton": true,
                    "positionClass": "toast-bottom-right",
                    "timeOut": "3000"
                };
                return toastr.error("Please enter duration as a number!")
            }
            if(!$scope.business.eventsDurationForGuests){
                $scope.business.eventsDurationForGuests = $scope.business.eventsDurationForGuests = {};
            }
            $scope.business.eventsDurationForGuests[newDurationForGuests.guests] = newDurationForGuests.duration;
            return $scope.business.$save().then(function(){
                toastr.options = {
                    "closeButton": true,
                    "positionClass": "toast-bottom-right",
                    "timeOut": "3000"
                };
                toastr.success("Saved!")

            });
        };

        $scope.removeDurationForGuests = function(key){
            if(key){
                $scope.business.eventsDurationForGuests[key] = null;
                return $scope.business.$save().then(function(){
                    toastr.options = {
                        "closeButton": true,
                        "positionClass": "toast-bottom-right",
                        "timeOut": "3000"
                    };
                    toastr.success("Duration for guests was Removed!")

                });
            }
            toastr.options = {
                "closeButton": true,
                "positionClass": "toast-bottom-right",
                "timeOut": "3000"
            };
            return toastr.error("Error!")
        };

        $scope.saveGuestsPer15 = function(){
            return $scope.business.$save().then(function(){
                toastr.options = {
                    "closeButton": true,
                    "positionClass": "toast-bottom-right",
                    "timeOut": "3000"
                };
                toastr.success("Guests per 15 minutes was saved!")
            });
        };


    });