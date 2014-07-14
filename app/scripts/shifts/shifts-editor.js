var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives
    .directive('shiftsEditor', function(ShiftsWeek, ShiftsNames, $timeout) {
        return {
            restrict: 'E',
            templateUrl : '/partials/shifts/shifts-editor.html',
            controller : function($scope, BusinessHolder, ShiftsWeek, Alert){
                var watcher, firstWeekWatch = false;
                $scope.msg = new Alert(3000);

                this.render = function(businessId, weekNumber){
                    if(!businessId || !weekNumber) return;
                    $scope.business = BusinessHolder.$business;
                    getShiftWeekWithNumber(weekNumber);
                }

                var getShiftWeekWithNumber = function(weekNumber){
                    $scope.week = new ShiftsWeek(weekNumber);
                    if(angular.isFunction(watcher)) watcher();
                    firstWeekWatch = false;
                    watcher = $scope.$watch('week', function(newVal, oldVal){
                        if(!oldVal) return;
                        if(firstWeekWatch){
                            $scope.week.saveAllDays().then(function(){
                                $scope.msg.setMsg("Changes Saved")
                            });
                        }else{
                            firstWeekWatch = true;
                        }
                    }, true);
                }


            },
            require : 'shiftsEditor',
            scope :{
            },
            link: function(scope, elem, attrs, ctrl) {
                var weekNumber, businessId;
                scope.ShiftsNames = ShiftsNames;

                attrs.$observe('week', function(newVal){
                    if(newVal){
                        weekNumber = newVal;
                        ctrl.render(businessId, weekNumber);
                    }
                });
                attrs.$observe('businessId', function(newVal, oldVal){
                    if(newVal){
                        businessId = newVal;
                        ctrl.render(businessId, weekNumber);
                    }
                });


            }
        };
    });