//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('EventsStatusesCtrl', function($scope,BusinessMetaData, BusinessHolder, Alert){

        // get business meta data
        $scope.businessMetaData = BusinessMetaData;
        // check if ID is available
        // get business data from business holder
        $scope.business = BusinessHolder.business;
        $scope.eventsStatuses = $scope.business.eventsStatuses;


        $scope.add = function(newStatus){
            if(!newStatus || !newStatus.color || !newStatus.status || newStatus.length < 2){
                toastr.options = {
                    "closeButton": true,
                    "positionClass": "toast-bottom-right",
                    "timeOut": "3000"
                };
                return toastr.error("Please enter status and color!")
            }
            $scope.eventsStatuses[newStatus.status] = {
                color : newStatus.color
            }

            return $scope.business.$save().then(function(){
                newStatus = {};
                toastr.options = {
                    "closeButton": true,
                    "positionClass": "toast-bottom-right",
                    "timeOut": "3000"
                };
                return toastr.success("Saved!")
            }, function(){
                newStatus = {};
                toastr.options = {
                    "closeButton": true,
                    "positionClass": "toast-bottom-right",
                    "timeOut": "3000"
                };
                return toastr.success("Error removing status!")
            });


        };

        $scope.remove = function(statusId){
            if(statusId){
                $scope.eventsStatuses[statusId] = null;
                return $scope.business.$save().then(function(){
                    toastr.options = {
                        "closeButton": true,
                        "positionClass": "toast-bottom-right",
                        "timeOut": "3000"
                    };
                    return toastr.success("Status was removed!")

                }, function(){
                    toastr.options = {
                        "closeButton": true,
                        "positionClass": "toast-bottom-right",
                        "timeOut": "3000"
                    };
                    return toastr.error("Error removing status!")
                });

            }
            toastr.options = {
                "closeButton": true,
                "positionClass": "toast-bottom-right",
                "timeOut": "3000"
            };
            return toastr.error("Error removing status!")

        };

        $scope.changed = _.throttle(function(statusId, status){
            return $scope.business.$save().then(function(){
                toastr.options = {
                    "closeButton": true,
                    "positionClass": "toast-bottom-right",
                    "timeOut": "3000"
                };
                return toastr.success("Status was changed!")

            }, function(){
                toastr.options = {
                    "closeButton": true,
                    "positionClass": "toast-bottom-right",
                    "timeOut": "3000"
                };
                return toastr.success("Error!")
            });

        }, 100);

    });