//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers

    .controller('ShiftSelectorCtrl', function($scope, DateHolder, ShiftsDayHolder, BusinessHolder, DateHelpers){
        $scope.ShiftsDayHolder = ShiftsDayHolder;

        $scope.$watch(function(){
            return DateHolder.current;
        }, function(){
            if(!DateHolder.current) return;
            generateShiftHours();
            $scope.minuteLabel = moment(DateHolder.current).minute();
        });

        var generateShiftHours = function(){
            if(!ShiftsDayHolder.selected) return;
            var startTimeMoment = moment(ShiftsDayHolder.selected.startTime);
            var initialDay = startTimeMoment.dayOfYear();
            var endTimeMoment = moment(ShiftsDayHolder.selected.endTime);
            var nowHour = moment(DateHolder.current).hour();
            var result = [
//                {value : 'NOW', label : 'NOW'},
                {value : 'ENTIRE_SHIFT', label : 'ENTIRE_SHIFT'}
            ];
            var hourToPush;
            do{

                hourToPush = startTimeMoment.hour();


                if(startTimeMoment.dayOfYear() == initialDay){
                    result.push({value : hourToPush, label :  hourToPush});
                }else{
                    result.push({value : hourToPush, label : startTimeMoment.format('MM/dd/yyyy HH:MM')});
                }
                startTimeMoment.minutes(0).add('hours',1);
            }while (startTimeMoment <= endTimeMoment);

            $scope.hourLabel = nowHour;
            $scope.shiftHours =  result;
        }

        $scope.defaultShiftMinutes = [0,15,30,45];


        $scope.hourChanged = function(newHour){
            var hour = newHour.value;
            $scope.hourLabel = newHour.label;
            if(hour == 'ENTIRE_SHIFT'){
                DateHolder.isEntireShift=true;
            }else if(hour == 'NOW'){
                DateHolder.isEntireShift = false;
            }else{
                DateHolder.isEntireShift = false;
                DateHolder.current = DateHelpers.changeDateHourAndMinutes(DateHolder.current,null,hour, null);
            }

        };


        $scope.minuteChanged = function(minute){
            $scope.minuteLabel = minute;
            DateHolder.current = DateHelpers.changeDateHourAndMinutes(DateHolder.current,null,null, minute);
        };
    });