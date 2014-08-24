//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('ShiftsCtrl', function($scope){
        $scope.nextWeek = function(){
            $scope.weekNumber = moment().week($scope.weekNumber).add('weeks',1).week();
        };

        $scope.previousWeek = function(){
            $scope.weekNumber = moment().week($scope.weekNumber).subtract('weeks',1).week();
        }

        var initWithNowDate = function(){
            $scope.weekNumber = moment().week();
        }

        initWithNowDate();
    });