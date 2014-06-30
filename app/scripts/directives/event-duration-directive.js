var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives

    .directive('hlEventDurationSelect', ['$timeout','FullDateFormat', 'EventsDurationForGuestsHolder','$rootScope', function ($timeout, FullDateFormat, EventsDurationForGuestsHolder,$rootScope) {

        return {
            restrict: 'E',
            template : '<select ng-model="selectedDuration" data-test="{{selectedDuration}}" ng-options="k as k for (k,v) in durations"></select>',
            require:['ngModel'],
            scope : {
                startTime : "=startTime",
                durations : "=durations"
            },
            link : function(scope, element, attrs, ctrls) {
                    var ngModel = ctrls[0];



                scope.$watch('startTime', function(newVal){
                    if(newVal){
                        if(!ngModel.$viewValue){
                            ngModel.$setViewValue('' + calcDuration(ngModel.$modelValue));
                            ngModel.$render();
                        }else{
                            ngModel.$setViewValue('' + ngModel.$viewValue);
                        }

                    }
                });



                scope.$watch('selectedDuration', function(newVal){
                    console.log('$watch selectedDuration',newVal);
                    ngModel.$setViewValue(newVal);
                });

                var calcDuration = function(modelValue){
                    console.log('formatters modelValue', modelValue);
                    if(!scope.startTime || !modelValue) return null;

                    var startTimeMoment = moment(scope.startTime);
                    var endTimeMoment = moment(modelValue);

                    var durationInMiliSeconds = endTimeMoment.diff(startTimeMoment, 'millisecond') + 1;
                    var durationInMinutes = Math.ceil(durationInMiliSeconds/1000/60);

                    return durationInMinutes;

                };

                ngModel.$formatters.push(calcDuration);

                ngModel.$render = function(){
                    console.log('$render',ngModel.$viewValue);
                    scope.selectedDuration = '' + ngModel.$viewValue;

                };



                ngModel.$parsers.push(function(viewValue){
                    console.log('$parsers viewValue', viewValue);
                    if(viewValue && scope.startTime)
                        return endTimeFromDuration(viewValue);
                });

                var endTimeFromDuration = function(duration){
                    var startTimeMoment = moment(scope.startTime);
                    var newEndTimeMoment = startTimeMoment.add('minutes', duration);
                    return new Date(newEndTimeMoment.format(FullDateFormat));
                };



            }
        };
    }]);