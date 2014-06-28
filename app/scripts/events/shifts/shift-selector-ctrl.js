'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers

    .controller('ShiftSelectorCtrl', function($scope, DateHolder, ShiftsDayHolder, BusinessHolder, DateHelpers){
        $scope.ShiftsDayHolder = ShiftsDayHolder;

        $scope.$watch(function(){
            return DateHolder.current;
        }, function(){
            if(!DateHolder.current) return;
            $scope.hour =  moment(DateHolder.current).hour();
            $scope.minute =  moment(DateHolder.current).minute();
        });

        $scope.shiftHours = function(){
            if(!ShiftsDayHolder.selected) return;
            var startTimeMoment = moment(ShiftsDayHolder.selected.startTime);
            var initialDay = startTimeMoment.dayOfYear();
            var endTimeMoment = moment(ShiftsDayHolder.selected.endTime);
            var result = [
                {value : 'NOW', label : 'NOW'},
                {value : 'ENTIRE_SHIFT', label : 'ENTIRE_SHIFT'}
            ];
            var hourToPush, oldHourToPush;
            do{
                if($scope.hour && hourToPush){
                    oldHourToPush = hourToPush;
                    hourToPush = startTimeMoment.hour();
                    if(parseInt($scope.hour) > hourToPush && (parseInt($scope.hour) < hourToPush)){
                        result.push({value : $scope.hour, label : $scope.hour});
                    }
                }else{
                    hourToPush = startTimeMoment.hour();
                }

                if(startTimeMoment.dayOfYear() == initialDay){
                    result.push({value : hourToPush, label :  hourToPush});
                }else{
                    result.push({value : hourToPush, label : startTimeMoment.format('MM/dd/yyyy HH:MM')});
                }
                startTimeMoment.minutes(0).add('hours',1);
            }while (startTimeMoment <= endTimeMoment);

            return result;
        }

        var defaultShiftMinutes = [0,15,30,45];
        $scope.shiftMinutes = function(){
            $scope.minute = $scope.minute || 0;
            if(~defaultShiftMinutes.indexOf($scope.minute)) return defaultShiftMinutes;
            var i = 0;
            while (i < defaultShiftMinutes){
                if($scope.minute < defaultShiftMinutes[i]){
                    break;
                }else if($scope.minute >= defaultShiftMinutes[i] && defaultShiftMinutes[++i] >= $scope.minute ){
                    break;
                }
            }
            var output = [].concat(defaultShiftMinutes);
            output.splice(i, 0, $scope.minute);
            return output;
        };


        $scope.hourChanged = function(){
            DateHolder.current = DateHelpers.changeDateHourAndMinutes(DateHolder.current,null,$scope.hour, null);
        };


        $scope.minuteChanged = function(){
            DateHolder.current = DateHelpers.changeDateHourAndMinutes(DateHolder.current,null,null, $scope.minute);
        };
    });