var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives
    .filter('weekRangeByWeekNumber', function(){
        return function(weekNumber){
            var date = moment().week(weekNumber);
            return date.day(0).format('DD/MM/YYYY') + " - " + date.day(6).format('DD/MM/YYYY');
        }
    })
    .directive('shiftsEditor', function(ShiftsWeek, ShiftsDayDefaults, $timeout) {
        return {
            restrict: 'E',
            templateUrl : '/partials/admin/shifts/shifts-editor.html',
            controller : function($scope, BusinessHolder, ShiftsWeek, Alert){
                $scope.msg = new Alert(3000);

                this.render = function(businessId, weekNumber){
                    if(!businessId || !weekNumber) return;
                    $scope.business = BusinessHolder.business;
                    getShiftWeekWithNumber(weekNumber);
                }

                var getShiftWeekWithNumber = function(weekNumber){
                    $scope.week = new ShiftsWeek(weekNumber);
                };

                $scope.dayWasChanged = function(day){
                    console.log('was changed : ',day);
                    if(day.$save) day.$saveWithValidation().then(function(){
                                $scope.msg.setMsg("Changes were Saved")
                        });
                }
            },
            require : 'shiftsEditor',
            scope :{
            },
            link: function(scope, elem, attrs, ctrl) {
                var weekNumber, businessId;
                scope.ShiftsDayDefaults = ShiftsDayDefaults;

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
