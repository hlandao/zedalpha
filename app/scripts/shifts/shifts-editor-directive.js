var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives
    .directive('shiftsEditor', function(ShiftsWeek, ShiftsNames, $timeout) {
        return {
            restrict: 'E',
            templateUrl : 'partials/shifts/shifts-editor.html',
            controller : function($scope, Business, ShiftsWeek, Alert){
                var daysArray, weekDateMoment, watcher, firstWeekWatch = false;
                $scope.msg = new Alert(3000);

                this.render = function(businessId, weekNumber){
                    $scope.business = Business.getBusinessWithId(businessId);
                    getShiftWeekWithNumber(weekNumber);
                }

                var getShiftWeekWithNumber = function(weekNumber){
                    weekDateMoment = moment().week(weekNumber);
                    $scope.week = new ShiftsWeek(weekNumber);
                    if(angular.isFunction(watcher)) watcher();
                    watcher = $scope.$watch('week', function(newVal, oldVal){
                        console.log('oldVal',oldVal);
                        if(!oldVal) return;
                        $scope.week.saveAllDays().then(function(){
                            if(firstWeekWatch){
                                $scope.msg.setMsg("Changes Saved")
                            }
                            firstWeekWatch = true;
                        });
                    }, true);
                }


            },
            require : 'shiftsEditor',
            link: function(scope, elem, attrs, ctrl) {
                var weekNumber, businessId;
                scope.ShiftsNames = ShiftsNames;

                attrs.$observe('week', function(newVal){
                    if(newVal){
                        weekNumber = newVal;
                        if(businessId){
                            ctrl.render(businessId, weekNumber);
                        }
                    }
                });
                scope.$watch('businessId', function(newVal, oldVal){
                    if(newVal){
                        businessId = newVal;
                        if(weekNumber){
                            ctrl.render(businessId, weekNumber);
                        }
                    }
                });

            }
        };
    });