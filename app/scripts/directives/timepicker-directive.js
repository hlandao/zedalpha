var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);

zedAlphaDirectives
    .directive('hlTimepicker', function ($timeout, DateHelpers, FullDateFormat, $rootScope, $parse, $filter, $compile, DateFormatFirebase) {
        return{
            restrict: 'A',
            replace: true,
            require: ['ngModel','hlTimepicker'],
            scope: {
                settings: "=",
                ngModel: "="
            },
            priority :1,
            templateUrl: "/partials/directives/timepicker-directive.html",
            controller: function ($scope) {
                var timeFormat = 'HH:mm',
                    intialized,
                    opened,
                    ngModel,
                    linkFN,
                    attrs,
                    lastMinDate,
                    defaultSettings = {
                        baseDate : null,
                        min: null,
                        max: null,
                        range : null,
                        intervalInMinutes : 15,
                        showDurationFromDate : null,
                        showOverlappingLabel : true
                    },
                    settings = defaultSettings;


                var init = this.init = function (_ngModel, _linkFN, _attrs) {
                    ngModel = ngModel || _ngModel;
                    linkFN =  linkFN || _linkFN;
                    attrs = attrs || _attrs;
                    settings = angular.extend(defaultSettings, $scope.settings);

                    ngModel.$render = function(){
                        if(ngModel.$modelValue){
                            setDefaultModelValue();
                            generateTimesArray();
                        }
                    };

                    ngModel.$parsers.unshift(function(viewValue){
                        if(viewValue){
                            return moment(viewValue);
                        }else{
                            return undefined;
                        }
                    });

                    $scope.$watch('settings', function(newVal,oldVal){
                        settings = angular.extend(defaultSettings, $scope.settings);
                        var max = (newVal && newVal.min && newVal.range) ? newVal.min.clone().add(newVal.range, 'minutes') : null ;
                        if(newVal && newVal.min && newVal.min.isAfter && newVal.min.isAfter(ngModel.$modelValue)){
                            ngModel.$modelValue = newVal.min.clone();
                        } else if(max && max.isBefore && max.isBefore(ngModel.$modelValue)){
                            ngModel.$modelValue = max;
                        }

                        setDefaultModelValue();
                        generateTimesArray();
                    }, true);

                    $scope.$watch('ngModel', function(newVal,oldVal){
                        ngModel.$render();
                    }, true);



                };

                var setDefaultModelValue = function(){
                    $scope.selected = getTimeObject(ngModel.$modelValue);
                }


                $scope.setNewTime = function(timeObj, e){
                    e.stopPropagation();
                    ngModel.$setViewValue(timeObj.time);
                    ngModel.$render();
                    $scope.opened = false;
                    attrs.onChange && $scope.$parent.$eval(attrs.onChange);
                }



                var resetTimesArray = function () {
                    if ($scope.times && $scope.times.length) {
                        $scope.times.length = 0;
                    }
                    $scope.times = [];
                }


                var generateTimesArray  = function () {
                    if(!opened) return;
                    if(!settings.min && !ngModel.$modelValue){
                        return;
                    }
                    var currentMoment,
                        interval = settings.intervalInMinutes,
                        min,
                        max,
                        currentMoment,
                        rangeInMinutes,
                        baseDate;


                    if(settings.baseDate){
                        baseDate = DateHelpers.isMomentValid(settings.baseDate) ? settings.baseDate : moment(settings.baseDate, DateFormatFirebase) ;
                    }

                    if(settings.min && DateHelpers.isMomentValid(settings.min)){
                        min = settings.min.clone();
                    }else if(baseDate && DateHelpers.isMomentValid(baseDate)){
                        min = baseDate.clone().hour(0).minute(0).seconds(0);
                    }else if(ngModel.$modelValue && DateHelpers.isMomentValid(ngModel.$modelValue)){
                        min = ngModel.$modelValue.clone().hour(0).minute(0).seconds(0);
                    }else{
                        return;
                    }

                    if(settings.max && DateHelpers.isMomentValid(settings.max)){
                        max = settings.max.clone();
                    }else if (ngModel.$modelValue && DateHelpers.isMomentValid(ngModel.$modelValue)){
                        max = ngModel.$modelValue.clone().hour(23).minute(59).seconds(0);
                    }else{
                        max = min.clone().hour(23).minute(59).seconds(0);
                    }

                    currentMoment = min.clone();
                    rangeInMinutes = settings.range || max.diff(min, 'minutes');

                    resetTimesArray();
                    lastMinDate = min;
                    var timeObj;
                    do{
                        timeObj = getTimeObject(currentMoment);
                        if (ngModel.$modelValue && currentMoment.isSame(ngModel.$modelValue, 'minutes')) {
                            $scope.selected = timeObj;
                        }
                        $scope.times.push(timeObj);
                        currentMoment.add(interval, 'minutes');

                    }while((rangeInMinutes -= interval) >= 0)
                };



                var getTimeObject = function (m) {
                    if(!m) return;
                    var timeString = m.format(timeFormat);
                    var label = timeString;
                    if(settings.showDurationFromDate){
                        label += " " + getDurationString(settings.showDurationFromDate, m);
                    }
//                    }else if(settings.showOverlappingLabel && lastMinDate){
//                        if(m.isAfter(lastMinDate, 'day')){
//                            label += " (+" + $filter('translate')('DAY') + ")";
//                        }
//                    }
                    return {
                        time: m.toISOString(),
                        label: label
                    };
                }


                var getDurationString = function (timeRef, time) {
                    if (!timeRef || !time) return "";

                    var overlappingLabel = "";
//                    if(settings.showOverlappingLabel && time.isAfter(lastMinDate, 'day')){
//                        overlappingLabel = " +" + $filter('translate')('DAY') + " ";
//                    }

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
                        return "(" + overlappingLabel + minutes + " " + $filter('translate')('MINUTES_SHORT') + ")";
                    } else {
                        return "(" + overlappingLabel + hours + ((minutes > 0) ? (":" + minutes) : "") + " " + $filter('translate')('HOURS_SHORT') + ")";
                    }
                }

                this.open = function(){
                    if(!opened){
                        opened = true;
                        generateTimesArray();
                    }else if(!$scope.times) generateTimesArray();
                    $scope.opened = true;
                }

                this.close = function(){
                    $scope.opened = false;
                }

            },
            link: function (scope, element, attrs, ctrls) {
                var ngModel = ctrls[0],
                    ctrl = ctrls[1],
                    $html = $('html'),
                    $window = $(window),
                    $clonedElement,
                    $pickerHolder;


                var template = '<div class="picker picker--time picker--focused picker--opened" ng-show="opened">' +
                    '<div class="picker__holder" ng-click="close()">'+
                    '<div class="picker__frame">'+
                    '<div class="picker__wrap">'+
                    '<div class="picker__box">'+
                    '<ul class="picker__list">'+
                    '<li class="picker__list-item" ng-repeat="time in times" ng-click="setNewTime(time, $event)" ng-class="{\'picker__list-item--selected picker__list-item--highlighted picker__list-item--viewset\' : (time === selected)}">{{time.label}}</li>'+
                    '</ul>'+
                    '</div>'+
                    '</div>'+
                    '</div>'+
                    '</div>'+
                    '</div>';

                var init = function() {
                    ctrl.init(ngModel, this, attrs);

                    $clonedElement = $compile(template)(scope, function (clonedElement, scope) {

                    });

                    angular.element('body').append($clonedElement);
                    $pickerHolder = $clonedElement.find('.picker__holder').eq(0);
                }



                init();

                scope.open = function(e){
                    e.preventDefault();
                    e.stopPropagation();
                    ctrl.open();
                    setTimeout(function(){
                        var $ul = $clonedElement.find('ul').eq(0);
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
                    var widthWithScroll = $inner[0].offsetWidth;

                    // Remove the divs.
                    $outer.remove();

                    // Return the difference between the widths.
                    return widthWithoutScroll - widthWithScroll
                }

            }
        };
    });