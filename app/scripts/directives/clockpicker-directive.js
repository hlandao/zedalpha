var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives

    .directive('hlClockpicker', ['$timeout','DateHelpers','FullDateFormat', function ($timeout,DateHelpers,FullDateFormat) {

        return {
            restrict: 'E',
            replace: true,
            require:['ngModel'],
            templateUrl: '/partials/directives/clockpicker-directive.html',
            link : function(scope, element, attrs, ctrls) {
                var ngModel = ctrls[0];
                var donetext = attrs.donetext || 'Ok';

                element.find('input').eq(0).clockpicker({
                    donetext : donetext
                });

                ngModel.$formatters.push(function(modelValue){
                    return moment(modelValue).format("HH:mm");
                });


                ngModel.$render = function(){
                    scope.theHour = ngModel.$viewValue;
                };


                scope.$watch('theHour', function(newVal){
                    ngModel.$setViewValue(newVal);
                });


                ngModel.$parsers.push(function(viewValue){
                    var hourSplitted = DateHelpers.hourAndMinutesArrFromString(viewValue);
                    if(hourSplitted){
                        return new Date(moment(ngModel).hour(hourSplitted.hour).minute(hourSplitted.minute).format(FullDateFormat));
                    }

                });

            }
        };
    }]);