'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('EventsStatusesCtrl', function($scope,BusinessMetaData, BusinessHolder, Alert){

        // get business meta data
        $scope.businessMetaData = BusinessMetaData;
        // check if ID is available
        // get business data from business holder
        $scope.business = BusinessHolder.$business;
        $scope.businessId = BusinessHolder.businessId;


        $scope.msg = new Alert(4000);

        $scope.add = function(newStatus){
            $scope.err = null;
            $scope.msg.setMsg('');
            if(!newStatus || !newStatus.color || !newStatus.status || newStatus.length < 2){
                $scope.err = "Please enter status and color";
                return;
            }
            $scope.eventsStatuses.$add(newStatus);
            newStatus = {};
            $scope.msg.setMsg('Saved!');
        };

        $scope.remove = function(statusId){
            if(statusId){
                var $status = $scope.eventsStatuses.$child(statusId);
                if($status){
                    $status.$remove();
                    return $scope.msg.setMsg('Status Removed!');
                }
            }
            $scope.err = "Error!"
        };

        $scope.changed = _.throttle(function(statusId, status){
            if(statusId && status){
                var $status = $scope.eventsStatuses.$child(statusId);
                if($status){
                    angular.extend($status, status);
                    $status.$save();
                    return $scope.msg.setMsg('Status saved!');
                }
            }
            $scope.err = "Error!"

        }, 100);

    });