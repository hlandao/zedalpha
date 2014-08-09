var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);

var _e;
zedAlphaDirectives

    .directive('hlTimepicker', ['$timeout','DateHelpers','FullDateFormat','$rootScope','$parse','DateHolder', function ($timeout,DateHelpers,FullDateFormat,$rootScope,$parse,DateHolder) {

        return {
            restrict: 'E',
            replace: true,
            require:['ngModel'],
            scope : {},
            templateUrl: '/partials/directives/timepicker-dropdown-directive.html',
            link : function(scope, element, attrs, ctrls) {
                var ngModel = ctrls[0];
                var interval = 15;
                var cellHeight = 43;
                var $ul = element.find('.list-group').eq(0);
                scope.format = 'HH:mm';

                var calcHoursArr = function(date){
                    var originalDateMoment = moment(date).seconds(0),
                        dateMoment = moment(date).hours(0).minutes(0).seconds(0),
                        currentFormattedDate,
                        selectedTime,
                        nextDayMoment = dateMoment.clone().add('days', 1),
                        offset;


                    scope.times = [];
                    var diff;

                    while (nextDayMoment.diff(dateMoment, 'minutes') > 0){
                        currentFormattedDate = new Date(dateMoment.format(FullDateFormat));
                        scope.times.push(currentFormattedDate);
                        diff = originalDateMoment.diff(dateMoment, 'minutes');
                        if(diff == 0 || (diff > 0 && diff <= interval)){
                            selectedTime = currentFormattedDate;
                        }

                        dateMoment.add('minutes', interval);
                    }

                    scope.selectedTime = selectedTime;
                    return scope.times;
                };


                var calcOffset = function(){
                    if(!scope.times) return;
                    var index = scope.times.indexOf(scope.selectedTime);
                    cellHeight = $ul.children().eq(0).outerHeight();
                    offset = Math.abs((index-2) * cellHeight);
                }

                scope.setOffset = function(){
                    calcOffset();
                    console.log('offset',offset);
                    $ul.slimScroll({ scrollTo: offset + 'px' });
//                    $ul.scrollTop(offset);
                };


                ngModel.$formatters.push(function(modelValue){
                    return modelValue;
                });


                ngModel.$render = function(){
                    calcHoursArr(ngModel.$modelValue);
                    scope.selected = ngModel.$modelValue;
                };


                scope.setNewTime = function(time){
                    if(time){
                        ngModel.$setViewValue(time);
                        ngModel.$render();
                    }
                };

                ngModel.$parsers.push(function(viewValue){
                    return viewValue;
                });



                scope.$on('closeAllOpenControls', function(){
                });

            }
        };
    }]);