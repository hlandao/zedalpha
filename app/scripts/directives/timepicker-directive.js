var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);

var h = 1;
zedAlphaDirectives
    .directive('hlTimepicker',function ($timeout,DateHelpers,FullDateFormat,$rootScope,$parse,DateHolder, $filter) {
        return{
            restrict: 'E',
            replace: true,
            require:['ngModel', 'hlTimepicker'],
            scope : {
                shift : "=",
                minTime : "=",
                maxTime : "=",
                timeRange : "=",
                intervalMs  : "@",
                showDurationMinTime : "@"

            },
            templateUrl: function(elem,attrs) {
                return (attrs.useInHeader) ? "/partials/directives/timepicker-header-directive.html" : "/partials/directives/timepicker-directive.html";
            },
            controller : function($scope){
                var cellHeight       = 43,
                    oneMinute        = 1000 * 60,
                    oneHour          = oneMinute * 60,
                    oneDay           = oneHour * 24,
                    intervalMS       = 1000 * 60 * 15,
                    minIntervalMS    = 1000 * 60,
                    timeFormat       = 'HH:mm',
                    intialized,
                    ngModel,
                    linkFN;


                this.init = function(_ngModel, _linkFN){
                    ngModel = _ngModel;
                    linkFN = _linkFN;
                    ngModel.$formatters.push(function(modelValue){
                        return modelValue;
                    });


                    ngModel.$render = function(){
                        if($scope.isEntireShift){
                            offset=0;
                            $scope.selected = null;
                            $scope.selectedTime = null;
                        }else{
                            findAndSetSelected();
                        }
                    };


                    ngModel.$parsers.push(function(viewValue){
                        return viewValue;
                    });

                };


                var resetTimesArray = function(){
                    if($scope.times && $scope.times.length){
                        $scope.times.length = 0;
                    }
                    $scope.times = [];
                }
                
                var calcHoursArr = this.calcHoursArr = function(){
                    var theDate = new Date(ngModel.$modelValue),
                        dateTimestamp = theDate.getTime(),
                        placedSelected = $scope.isEntireShift ? true : false,
                        startTimestamp,
                        endTimestamp,
                        diff,
                        _intervalMS = $scope.intervalMs ? parseInt($scope.intervalMs) : intervalMS;

                    _intervalMS = Math.max(_intervalMS, minIntervalMS);
                    resetTimesArray();

                    if($scope.minTime){
                        startTimestamp = new Date($scope.minTime);
                        startTimestamp = startTimestamp.setSeconds(0);
                        if($scope.maxTime){
                            endTimestamp = new Date($scope.maxTime).setSeconds(0);
                        } else if($scope.timeRange){
                            endTimestamp = startTimestamp + parseInt($scope.timeRange);
                        } else {
                            endTimestamp = startTimestamp +  oneDay;
                        }
                    } else if($scope.shift && $scope.shift.startTime && $scope.shift.endTime){

                        startTimestamp = new Date($scope.shift.startTime).setSeconds(0);
                        endTimestamp = new Date($scope.shift.endTime).setSeconds(0);
                    } else if(theDate){
                        startTimestamp = new Date(theDate);
                        startTimestamp.setHours(0);
                        startTimestamp.setSeconds(0);
                        startTimestamp = startTimestamp.setMinutes(0);
                        endTimestamp = startTimestamp + oneDay;
                    }else {
                        return;
                    }


                    var timeObj;
                    while ((endTimestamp - startTimestamp) >= 0){
                        timeObj = getTimeObject(startTimestamp);
                        diff = startTimestamp - dateTimestamp;
                        if(!placedSelected && diff >= 0 && diff <= oneMinute){
                            placedSelected = true;
                            $scope.times.push($scope.selectedTime);
                        }else if(!placedSelected && diff > 0 && diff < _intervalMS){
                            placedSelected = true;
                            $scope.times.push(timeObj);
                            $scope.times.push($scope.selectedTime);
                        }else {
                            $scope.times.push(timeObj);
                        }

                        startTimestamp += _intervalMS;
                    }

                    return $scope.times;
                };


                var getTimeObject = function(time){
                    var timeString = $filter('date')(time, timeFormat);
                    var label = ($scope.showDurationMinTime && $scope.minTime) ? (timeString + " " +getDurationString($scope.minTime, time)) : timeString ;
                    return {
                        time : time,
                        label : label
                    };
                }

                var findAndSetSelected = function(){
                    var timeObj = getTimeObject(ngModel.$modelValue);
                    $scope.selectedTime = timeObj;
                }


                var getDurationString = function(minTimeReference, time){
                    if(!minTimeReference || !time) return "";
                    minTimeReference = new Date(minTimeReference).getTime();
                    time = new Date(time).getTime();

                    var diff = time - minTimeReference;
                    var hours   = Math.floor(diff / oneHour);
                    var minutes = Math.floor((diff - (hours * oneHour)) / oneMinute);

                    if (hours   < 10 && hours > 0 && minutes > 0) {hours   = "0"+hours;}
                    if (minutes < 10) {minutes = "0"+minutes;}

                    if( diff < 0){
                        return "";
                    }else if (hours  === 0 ){
                        return "(" + minutes + " " + $filter('translate')('MINUTES_SHORT') + ")";
                    }else{
                        return "(" + hours + ((minutes > 0) ? (":" + minutes) : "") + " " + $filter('translate')('HOURS_SHORT')+ ")";
                    }
                }


                $scope.setNewTime = function(time, isEntireShift){
                    if(time){
                        var timeMomemnt = moment(time.time);
                        DateHolder.isEntireShift = false;
                        ngModel.$setViewValue(new Date(time.time));
                        $scope.isEntireShift = false;
                        ngModel.$render();
                    }else if(isEntireShift){
                        DateHolder.isEntireShift = true;
                        $scope.isEntireShift = true;
                        ngModel.$render();
                    }
                };



//                var shiftWatcher = $scope.$watch('shift', calcHoursArr, true);
                var minTimeWatcher = $scope.$watch('minTime', function(newVal){
                    findAndSetSelected();
                });
//                var maxtimeWatcher = $scope.$watch('maxTime', calcHoursArr);
//                var timeRangeWatcher = $scope.$watch('timeRange', calcHoursArr);
//
//                $scope.$on('$destroy', function(){
//                    shiftWatcher();
//                    minTimeWatcher();
//                    maxtimeWatcher();
//                    timeRangeWatcher();
//                });

            },
            link : function(scope, element, attrs, ctrls) {
                var ngModel = ctrls[0],
                    ctrl = ctrls[1],
                    $ul = element.find('.list-group').eq(0);

                ctrl.init(ngModel, this);

                var getOffset = function(){
                    var offset;
                    if(!scope.times) return;
                    var index = scope.times.indexOf(scope.selectedTime);
                    if(index == -1) return offset = 0;
                    cellHeight = $ul.children().eq(0).outerHeight();
                    offset = index == 0 ? 0 : Math.abs((index) * cellHeight);
                    return offset;
                }

                scope.setOffset = function(){
                    ctrl.calcHoursArr();
                    setTimeout(function(){
                        var offset = getOffset();
                        $ul.scrollTop(offset);
                    },1);
                };

            }
        };
    });