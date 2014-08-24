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

        $scope.msg = new Alert(4000);

        $scope.add = function(newStatus){
            $scope.err = null;
            $scope.msg.setMsg('');
            if(!newStatus || !newStatus.color || !newStatus.status || newStatus.length < 2){
                $scope.err = "Please enter status and color";
                return;
            }
            $scope.eventsStatuses[newStatus.status] = {
                color : newStatus.color
            }

            return $scope.business.$save().then(function(){
                newStatus = {};
                $scope.msg.setMsg('Saved!');
            }, function(){
                $scope.err = "Error removing status!"
            });


        };

        $scope.remove = function(statusId){
            if(statusId){
                $scope.eventsStatuses[statusId] = null;
                return $scope.business.$save().then(function(){
                    $scope.msg.setMsg('Status was removed!');
                }, function(){
                    $scope.err = "Error removing status!"
                });

            }
            $scope.err = "Error removing status!"
        };

        $scope.changed = _.throttle(function(statusId, status){
            return $scope.business.$save().then(function(){
                $scope.msg.setMsg('Status was changed!');
            }, function(){
                $scope.err = "Error!"
            });

        }, 100);

    });