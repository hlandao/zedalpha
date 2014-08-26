var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);

zedAlphaDirectives
    .directive('hlShiftDuration', function ($timeout, DateHelpers, FullDateFormat, $rootScope, $parse, $filter) {
        return{
            restrict: 'A',
            replace: true,
            require: ['hlShiftDuration'],
            scope: {
                shift: "=",
                settings: "="
            },
            templateUrl: "/partials/directives/shift-duration-directive.html",
            controller: function ($scope) {
                var cellHeight,
                    timeFormat = 'HH:mm',
                    intialized,
                    linkFN,
                    attrs;


                var settings = angular.extend({
                    rangeInHours: 10,
                    intervalInMintues: 15
                }, $scope.settings);


                this.init = function (_linkFN, _attrs) {
                    linkFN = _linkFN;
                    attrs = _attrs;
                    $scope.$watch('shift.startTime', generateTimesArray);
                };


                var resetTimesArray = function () {
                    if ($scope.times && $scope.times.length) {
                        $scope.times.length = 0;
                    }
                    $scope.times = [];
                }

                var generateTimesArray = this.generateTimesArray = function () {
                    var currentMoment,
                        diff,
                        interval = settings.intervalInMintues,
                        rangeInMinutes = settings.rangeInHours * 60,
                        duration = $scope.shift.duration;

                    resetTimesArray();

                    if ($scope.shift && $scope.shift.startTime) {
                        currentMoment = $scope.shift.startTime.clone().add(interval, 'minutes');
                    } else {
                        return;
                    }


                    var timeObj;

                    while ((rangeInMinutes -= interval) >= 0) {
                        timeObj = getTimeObject(currentMoment);
                        diff = currentMoment.diff($scope.shift.startTime, 'minutes');
                        if (diff == duration) {
                            $scope.selected = timeObj;
                        }
                        $scope.times.push(timeObj);
                        currentMoment.add(interval, 'minutes');
                    }
                };


                var getTimeObject = function (m) {
                    var timeString = m.format(timeFormat);
                    var label = timeString + " " + getDurationString($scope.shift.startTime, m)
                    return {
                        time: m.toISOString(),
                        label: label
                    };
                }


                var getDurationString = function (timeRef, time) {
                    if (!timeRef || !time) return "";

                    var diff = time.diff(timeRef, 'minutes');
                    var hours = Math.floor(diff / 60);
                    var minutes = Math.floor((diff - (hours * 60)));

                    if (hours < 10 && hours > 0 && minutes > 0) {
                        hours = "0" + hours;
                    }
                    if (minutes < 10) {
                        minutes = "0" + minutes;
                    }

                    if (diff < 0) {
                        return "";
                    } else if (hours === 0) {
                        return "(" + minutes + " " + $filter('translate')('MINUTES_SHORT') + ")";
                    } else {
                        return "(" + hours + ((minutes > 0) ? (":" + minutes) : "") + " " + $filter('translate')('HOURS_SHORT') + ")";
                    }
                }

                $scope.open = function(){
                    $scope.opened = true;
                }

                $scope.close = function(){
                    $scope.opened = false;
                }


                $scope.setNewDuration = function(timeObject, e){
                    e.stopPropagation();
                    if(timeObject){
                        var minutes = moment(timeObject.time).diff($scope.shift.startTime, 'minutes');
                        $scope.selected = timeObject;
                        $scope.shift.duration = minutes;
                        if(attrs.onChange) $scope.$parent.$eval(attrs.onChange);
                    }
                    $scope.opened = false;
                };

            },
            link: function (scope, element, attrs, ctrls) {
                var ctrl = ctrls[0],
                    $ul = element.find('.picker__list').eq(0);

                ctrl.init(this, attrs);

//                var getOffset = function(){
//                    var offset;
//                    if(!scope.times) return;
//                    var index = scope.times.indexOf(scope.selectedTime);
//                    if(index == -1) return offset = 0;
//                    cellHeight = $ul.children().eq(0).outerHeight();
//                    offset = index == 0 ? 0 : Math.abs((index) * cellHeight);
//                    return offset;
//                }
//
//                scope.setOffset = function(){
//                    ctrl.calcHoursArr();
//                    setTimeout(function(){
//                        var offset = getOffset();
//                        $ul.scrollTop(offset);
//                    },1);
//                };

            }
        };
    });