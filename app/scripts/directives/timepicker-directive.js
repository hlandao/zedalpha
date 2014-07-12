var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);

var _e;
zedAlphaDirectives

    .directive('hlTimepicker', ['$timeout','DateHelpers','FullDateFormat','$rootScope','$parse', function ($timeout,DateHelpers,FullDateFormat,$rootScope,$parse) {

        return {
            restrict: 'E',
            replace: true,
            require:['ngModel'],
            scope : {},
            templateUrl: '/partials/directives/timepicker-directive.html',
            link : function(scope, element, attrs, ctrls) {
                var ngModel = ctrls[0];
                var initialized = false;
                var minHour = 0, maxHour = 23;

                var init = function(modelValue){
                    _e = element;
                    element.timepicker({
                        timeFormat : 'HH:mm',
                        interval : 15,
                        dynamic : false,
                        minHour : minHour,
                        maxHour : maxHour,
                        change : function(time){
                            if(!initialized){
                                return initialized = true;
                            }
                            $rootScope.safeApply(function(){
                                ngModel.$setViewValue(time);
                            });
                        }
                    });


                    if(modelValue){
                        var defaultTime = moment(ngModel.$modelValue).format("HH:mm");
                        element.timepicker('setTime',defaultTime);
                    }
                };
                init(ngModel.$modelValue);


                if (attrs.minHour) {
                    scope.$parent.$watch($parse(attrs.minHour), function(value) {
                        var theDate = moment(value);
                        minHour = theDate ? theDate.hour() : minHour;
                        element.timepicker('option','minHour', minHour);
                    });
                }

                if (attrs.maxHour) {
                    scope.$parent.$watch($parse(attrs.maxHour), function(value) {
                        var theDate = moment(value);
                        maxHour = (theDate) ?theDate.hour() : maxHour;
                        element.timepicker('option','maxHour', maxHour);
                    });
                }



                ngModel.$formatters.push(function(modelValue){
                    return moment(modelValue).format("HH:mm");
                });


                ngModel.$render = function(){
                    element.timepicker('setTime', ngModel.$viewValue)
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