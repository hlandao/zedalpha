var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives

    .controller('HlStatusSelectorCtrl', function ($scope, DateHelpers, BusinessHolder, $timeout){
        var EventsStatusesHolder = BusinessHolder.business.eventsStatuses;

        var ngModel;
        var dateMoment;
        console.log('BusinessHolder',BusinessHolder);

        $scope.EventsStatusesHolder = EventsStatusesHolder;

        $scope.toggleSelector = function(e){
            e.preventDefault();
            e.stopPropagation();
            $scope.showSelector = !$scope.showSelector
        };

        $scope.selectStatus = function(selectedStatus, e){
            console.log('selectedStatus',selectedStatus);
            ngModel.$setViewValue(selectedStatus    );
            $scope.status = findStatusByStatus(selectedStatus);
        };


        this.init = function(_ngModel){
            ngModel = _ngModel;
            ngModel.$render=function(){
                $scope.status = findStatusByStatus(ngModel.$modelValue);
            };

        }


        var findStatusByStatus = function(status){
            return _.findWhere(EventsStatusesHolder, {status : status});
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

                scope.$on('closeAllOpenControls', function(){
                    scope.showSelector = false;
                });
            }
        };
    }]);