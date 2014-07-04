var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives

    .controller('HlStatusSelectorCtrl', function hlTimePickerController($scope, DateHelpers, EventsStatusesHolder, $timeout){
        var ngModel;
        var dateMoment;
        this.init = function(_ngModel){
            ngModel = _ngModel;

            ngModel.$render=function(){
                $scope.status = ngModel.$viewValue;
            };


            $scope.toggleSelector = function(e){
                e.preventDefault();
                e.stopPropagation();
                $scope.showSelector = !$scope.showSelector
            }
            $scope.selectStatus = function(selectedStatus, e){
                e.preventDefault();
                e.stopPropagation();

                ngModel.$setViewValue(selectedStatus);
                $scope.status = selectedStatus;
                $timeout(function(){
                    $scope.showSelector = false;
                },100);
            };

            $scope.EventsStatusesHolder = EventsStatusesHolder;
        }
    })
    .directive('hlStatusSelector', ['$timeout', function ($timeout) {

        return {
            restrict: 'E',
            replace: true,
            require:['hlStatusSelector', '?^ngModel'],
            controller : 'HlStatusSelectorCtrl',
            scope: {
                disabled : "="
            },
            templateUrl: '/partials/directives/status-selector-directive.html',
            link : function(scope, element, attrs, ctrls) {
                var ctrl = ctrls[0];
                var ngModel = ctrls[1];


                if ( ngModel ) {
                    ctrl.init( ngModel);
                }
            }
        };
    }]);