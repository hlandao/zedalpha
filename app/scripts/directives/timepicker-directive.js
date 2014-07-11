var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives

    .directive('hlTimepicker', ['$timeout','DateHelpers','FullDateFormat','$rootScope', function ($timeout,DateHelpers,FullDateFormat,$rootScope) {

        return {
            restrict: 'E',
            replace: true,
            require:['ngModel'],
            scope : {},
            templateUrl: '/partials/directives/timepicker-directive.html',
            link : function(scope, element, attrs, ctrls) {
                var ngModel = ctrls[0], ngModelWatcher, initialized = false;

                ngModelWatcher = scope.$watch(function(){
                    return ngModel.$modelValue;
                }, function(newVal){
                    if(!newVal) return;
                   var theDate = angular.isDate(newVal) ? newVal : new Date(newVal);

                   if(theDate && angular.isDate(theDate)){
                       ngModelWatcher();
                       var defaultTime = moment(ngModel.$modelValue).format("HH:mm");
                       element.timepicker({
                           timeFormat : 'HH:mm',
                           interval : 15,
                           dynamic : false,
                           change : function(time){
                               if(!initialized){
                                return initialized = true;
                               }
                               $rootScope.safeApply(function(){
                                   ngModel.$setViewValue(time);
                               });
                           }
                       });
                       element.timepicker('setTime',defaultTime);
                   }
                });

                ngModel.$formatters.push(function(modelValue){
                    return moment(modelValue).format("HH:mm");
                });


                ngModel.$render = function(){
                    if(initialized){
                        element.timepicker('setTime', ngModel.$viewValue);
                    }
                };


                ngModel.$parsers.push(function(viewValue){
                    var viewValueMoment = moment(viewValue);

                    if(viewValueMoment){
                        var output = new Date(moment(ngModel.$modelValue).hour(viewValueMoment.hour()).minute(viewValueMoment.minute()).format(FullDateFormat));
                        return output;
                    }
                });

            }
        };
    }]);