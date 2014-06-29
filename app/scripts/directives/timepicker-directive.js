var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives

    .controller('HlTimePickerCtrl', function hlTimePickerController($scope, DateHelpers){
        var ngModel;
        var dateMoment;

        this.init = function(_ngModel, input){
            ngModel = _ngModel;

            ngModel.$render=function(){
                var dateMoment = moment(ngModel.$modelValue);
                $scope.timeInHours = dateMoment.format('HH:mm');
            }

            $scope.onChange = function(){
                var splittedTime = DateHelpers.hourAndMinutesArrFromString($scope.timeInHours);
                if(!splittedTime) return;
                var newdateMoment = moment(ngModel.$modelValue).hour(splittedTime.hour).minute(splittedTime.minute);
                ngModel.$setViewValue(new Date(newdateMoment.format("YYYY-MM-DD HH:mm:ss")));
            }
        }
    })
    .directive('hlTimepicker', ['$timeout', function ($timeout) {

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
                var input = element.find('input').eq(0);

                if ( ngModel ) {
                    ctrl.init( ngModel, input);
                }

                var unbindWatcher = scope.$watch('disabled', function(newVal){
                    input.attr('disabled',newVal);
                });

                scope.$on('$destroy', function(){
                    unbindWatcher();
                });


            }
        };
    }]);