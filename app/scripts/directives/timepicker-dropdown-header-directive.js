var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);

zedAlphaDirectives

    .directive('hlTimepickerDropdownHeader', ['$timeout','DateHelpers','FullDateFormat','$rootScope','$parse','DateHolder', function ($timeout,DateHelpers,FullDateFormat,$rootScope,$parse,DateHolder) {

        return {
            restrict: 'E',
            replace: true,
            require:['ngModel'],
            scope : {
                shift : "="
            },
            templateUrl: '/partials/directives/timepicker-dropdown-header-directive.html',
            link : function(scope, element, attrs, ctrls) {
                var ngModel = ctrls[0],
                    interval = 15,
                    intervalMS = interval * 1000 * 60,
                    cellHeight = 43,
                    $ul = element.find('.list-group').eq(0),
                    offest,
                    intialized,
                    oneMinute = 1000 * 60,
                    oneDay = oneMinute * 60 * 24;
                scope.format = 'HH:mm';

                var calcHoursArr = function(){

                    var date = new Date(ngModel.$modelValue),
                        startTimestamp = date.getTime(),
                        endTimestamp = startTimestamp + oneDay,
                        selectedTime;

                    if(scope.times && scope.times.length){
                        scope.times.length = 0;
                    }
                    scope.times = [];
                    var diff;

                    if(scope.shift){
                        if(scope.shift.startTime){
                            startTimestamp = new Date(scope.shift.startTime).getTime();
                        }
                        if(scope.shift.endTime){
                            endTimestamp = new Date(scope.shift.endTime).getTime();
                        }
                    }


                    while ((diff = endTimestamp - startTimestamp) > oneMinute){
                        scope.times.push(startTimestamp);
                        if(diff >= 0 && diff <= intervalMS){
                            selectedTime = startTimestamp;
                        }
                        startTimestamp += intervalMS;
                    }

                    scope.selectedTime = selectedTime;
                    return scope.times;
                };


                var calcOffset = function(){
                    if(!scope.times) return;
                    var index = scope.times.indexOf(scope.selectedTime);
                    if(index == -1) return offset = 0;
                    cellHeight = $ul.children().eq(0).outerHeight();
                    offset = index == 0 ? 0 : Math.abs((index-2) * cellHeight);
                }

                scope.setOffset = function(){
                    calcOffset();
//                    $ul.slimScroll({ scrollTo: offset + 'px' });
                    $ul.scrollTop(offset);
                };


                ngModel.$formatters.push(function(modelValue){
                    return modelValue;
                });


                ngModel.$render = function(){
                    if(scope.isEntireShift){
                        offset=0;
                        scope.selected = null;
                        scope.selectedTime = null;
                    }else{
                        scope.selected = ngModel.$modelValue;
                    }

                    if(!intialized){
                        initialized = true;
                        calcHoursArr();
                    }
                };


                scope.setNewTime = function(time, isEntireShift){
                    if(time){
                        DateHolder.isEntireShift = false;
                        ngModel.$setViewValue(time);
                        scope.isEntireShift = false;
                        ngModel.$render();
                    }else if(isEntireShift){
                        DateHolder.isEntireShift = true;
                        scope.isEntireShift = true;
                        ngModel.$render();
                    }
                };

                ngModel.$parsers.push(function(viewValue){
                    return viewValue;
                });



                scope.$on('closeAllOpenControls', function(){
                });

                scope.$watch('shift', calcHoursArr);

            }
        };
    }]);