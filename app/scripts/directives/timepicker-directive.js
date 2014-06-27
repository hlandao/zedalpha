var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives
    .constant('hlTimepickerConfig',{
        step : 900
    })
    .controller('HlTimePickerCtrl', function hlTimePickerController($scope){
        var ngModel;
        var dateMoment;

        this.init = function(_ngModel, input){
            ngModel = _ngModel;

            ngModel.$render=function(){
                var dateMoment = moment(ngModel.$modelValue);
                $scope.timeInHours = dateMoment.format('HH:mm');
            }

            $scope.$watch('disabled', function(newVal){
                input.attr('disabled',newVal);
            });

            $scope.onChange = function(){
                var splittedTime = splitHour($scope.timeInHours);
                if(!splittedTime) return;
                var newdateMoment = moment(ngModel.$modelValue).hour(splittedTime.hour).minute(splittedTime.minute);
                ngModel.$setViewValue(new Date(newdateMoment.format("YYYY-MM-DD HH:mm:ss")));
            }
        }

        var splitHour = function (hourStr) {
            if (!hourStr || !~hourStr.indexOf(':')) {
                return null;
            }
            var arr = hourStr.split(':');
            if (arr.length) {
                return {
                    hour: arr[0],
                    minute: arr[1]
                };
            } else {
                return null;
            }
        }

    })
    .directive('hlTimepicker', ['$timeout','hlTimepickerConfig', function ($timeout, hlTimepickerConfig) {

        return {
            restrict: 'E',
            replace: true,
            require:['hlTimepicker', '?^ngModel'],
            controller : 'HlTimePickerCtrl',
            scope: {
                disabled : "="
            },
            templateUrl: '/partials/directives/timepicker-directive.html',
            link : function(scope, element, attrs, ctrls) {
                var ctrl = ctrls[0];
                var ngModel = ctrls[1];

                if ( ngModel ) {
                    ctrl.init( ngModel, element.find('input').eq(0) );
                }


            }
        };
    }]);