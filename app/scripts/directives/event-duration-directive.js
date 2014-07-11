var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives
    .directive('hlEventDurationSelect', ['$timeout','FullDateFormat', 'EventsDurationForGuestsHolder','$rootScope','EventInterval','DateHelpers', function ($timeout, FullDateFormat, EventsDurationForGuestsHolder,$rootScope,EventInterval,DateHelpers) {

        return {
            restrict: 'E',
            templateUrl : '/partials/directives/event-duration-select-directive.html',
            scope : {
                event : "=event",
                durations : "=durations"
            },
            controller : function($scope){
                // ---------- Init timepicker ---------//
                $scope.timeFormat = 'HH:mm';
                $scope.interval = EventInterval;


                var setDurationLabel = function(){
                    var startTimeMoment = moment( $scope.event.startTime);
                    var endTimeMoment = moment( $scope.event.endTime);
                    $scope.durationLabel = Math.ceil(endTimeMoment.diff(startTimeMoment) / 1000) / 60;
                };


                var updateAllViewInputs = function(){
                    setDurationLabel();
                }

                updateAllViewInputs();
                // --------------- Init everything else --------------//


                $scope.$watch('event.startTime', function(newVal, oldVal){
                    if(newVal){
                        var startTimeMoment = moment(newVal);
                        var newEndTimeMoment = startTimeMoment.clone().add($scope.durationLabel, 'minutes');
                        $scope.event.endTime = new Date(newEndTimeMoment.format(FullDateFormat));
                    }
                });

                $scope.$watch('event.endTime', function(newVal, oldVal){
                    if(newVal){
                        var startTimeMoment = moment($scope.event.startTime);
                        var endTimeMoment = moment(newVal);
                        $scope.durationLabel = endTimeMoment.diff(startTimeMoment, 'minutes');
                    }
                });


                $scope.changeDuration = function(duration){
                    $scope.durationLabel = duration;
                    var startTimeMoment = moment($scope.event.startTime);
                    var newEndTimeMoment = startTimeMoment.add($scope.durationLabel, 'minutes');
                    $scope.event.endTime = new Date(newEndTimeMoment.format(FullDateFormat));
                    $timeout(updateAllViewInputs);
                }


            },
            link : function(scope, element, attrs) {
            }
        };
    }]);