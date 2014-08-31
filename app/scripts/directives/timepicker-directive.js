var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);

zedAlphaDirectives
    .directive('hlTimepicker', function ($timeout, DateHelpers, FullDateFormat, $rootScope, $parse, $filter) {
        return{
            restrict: 'A',
            replace: true,
            require: ['ngModel','hlTimepicker'],
            scope: {
                settings: "=",
                ngModel: "="
            },
            templateUrl: "/partials/directives/timepicker-directive.html",
            controller: function ($scope) {
                var timeFormat = 'HH:mm',
                    intialized,
                    ngModel,
                    linkFN,
                    attrs,
                    defaultSettings = {
                        min: null,
                        max: null,
                        range : null,
                        intervalInMinutes : 15,
                        showDurationFromDate : null
                    },
                    settings = defaultSettings;


                var initWatcher = false;
                var setNgModelWatcher = function(){
                    if(initWatcher) return;
                    initWatcher = true;
                    var ngModelWatcher = $scope.$watch('ngModel', function(newVal){
                        init();
                        if(newVal && ngModelWatcher) ngModelWatcher();
                    });
                }
                var init = this.init = function (_ngModel, _linkFN, _attrs) {
                    ngModel = ngModel || _ngModel;
                    linkFN =  linkFN || _linkFN;
                    attrs = attrs || _attrs;
                    settings = angular.extend(defaultSettings, $scope.settings);

                    if(!ngModel || !ngModel.$modelValue){
                        setNgModelWatcher();
                        return;
                    }else{
                        initialized = true;
                    }

                    if(!ngModel.$modelValue || !ngModel.$modelValue.isValid || !ngModel.$modelValue.isValid()){
                        throw new TypeError("Cannot iniate timepicker");
                    }


//                    generateTimesArray();

                    $scope.$watch('settings', function(newVal,oldVal){
                        settings = angular.extend(defaultSettings, $scope.settings);
                        generateTimesArray();
                    }, true);


                    ngModel.$render = function(){
                        if(!initialized){
                            init();
                        }else{
                            generateTimesArray();
                        }
                    };

                    ngModel.$parsers.unshift(function(viewValue){
                        if(viewValue){
                            return moment(viewValue.time);
                        }
                    });



                    $scope.setNewTime = function(timeObj, e){
                        e.stopPropagation();
                        ngModel.$setViewValue(timeObj);
                        generateTimesArray();
                        $scope.opened = false;
                        attrs.onChange && $scope.$parent.$eval(attrs.onChange);
                    }

                };


                var resetTimesArray = function () {
                    if ($scope.times && $scope.times.length) {
                        $scope.times.length = 0;
                    }
                    $scope.times = [];
                }

                var generateTimesArray  = function () {
                    var currentMoment,
                        interval = settings.intervalInMinutes,
                        max = settings.max ? settings.max.clone() : ngModel.$modelValue.clone().hour(23).minute(59).seconds(0),
                        min = (settings.min && settings.min.isValid && settings.min.isValid()) ? settings.min.clone() : ngModel.$modelValue.clone().hour(0).minute(0).seconds(0),
                        currentMoment = min.clone(),
                        v = min,
                        rangeInMinutes = settings.range || max.diff(min, 'minutes');

                    resetTimesArray();
                    var timeObj;
                    do{
                        timeObj = getTimeObject(currentMoment);
                        if (currentMoment.isSame(ngModel.$modelValue, 'minutes')) {
                            $scope.selected = timeObj;
                        }
                        $scope.times.push(timeObj);
                        currentMoment.add(interval, 'minutes');

                    }while((rangeInMinutes -= interval) >= 0)
                };


                var getTimeObject = function (m) {
                    var timeString = m.format(timeFormat);
                    var label = timeString;
                    label += (settings.showDurationFromDate) ? (" " + getDurationString(settings.showDurationFromDate, m)) : "" ;
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

            },
            link: function (scope, element, attrs, ctrls) {
                var ngModel = ctrls[0],
                    ctrl = ctrls[1],
                    $html = $('html'),
                    $window = $(window),
                    $pickerHolder = element.find('.picker__holder').eq(0);

                var init = function(){
                    ctrl.init(ngModel, this, attrs);
                }

                init();

                scope.open = function(e){
                    e.preventDefault();
                    e.stopPropagation();
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
                    var widthWithScroll = $inner[0].offsetWidth;

                    // Remove the divs.
                    $outer.remove()

                    // Return the difference between the widths.
                    return widthWithoutScroll - widthWithScroll
                }

            }
        };
    });