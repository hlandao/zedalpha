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

                this.open = function(){
                    $scope.opened = true;
                }

                this.close = function(){
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
                    $html = $('html'),
                    $window = $(window),
                    $pickerHolder = element.find('.picker__holder').eq(0);

                ctrl.init(this, attrs);

                scope.open = function(){
                    ctrl.open();
                    setTimeout(function(){
                        var $ul = element.find('ul').eq(0);
                        $html.
                            css( 'overflow', 'hidden' ).
                            css( 'padding-right', '+=' + getScrollbarWidth() )

                        var index = scope.times.indexOf(scope.selected);
                        var $child = $ul.children().eq(index);
                        var top = $child.position().top;
                        var height = $child[0].clientHeight;
                        $pickerHolder.scrollTop(top - height * 2);
                    },1);
                };

                scope.close = function(){
                    $html.
                        css( 'overflow', '' ).
                        css( 'padding-right', '-=' + getScrollbarWidth() )

                    ctrl.close();
                }

                function getScrollbarWidth() {

                    if ( $html.height() <= $window.height() ) {
                        return 0
                    }

                    var $outer = $( '<div style="visibility:hidden;width:100px" />' ).
                        appendTo( 'body' )

                    // Get the width without scrollbars.
                    var widthWithoutScroll = $outer[0].offsetWidth

                    // Force adding scrollbars.
                    $outer.css( 'overflow', 'scroll' )

                    // Add the inner div.
                    var $inner = $( '<div style="width:100%" />' ).appendTo( $outer )

                    // Get the width with scrollbars.
                    var widthWithScroll = $inner[0].offsetWidth

                    // Remove the divs.
                    $outer.remove()

                    // Return the difference between the widths.
                    return widthWithoutScroll - widthWithScroll
                }

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