var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives
        .directive('hlEventDurationSelect', ['$timeout','FullDateFormat', 'EventsDurationForGuestsHolder','$rootScope','EventInterval','DateHelpers','EventsDurationHolder', function ($timeout, FullDateFormat, EventsDurationForGuestsHolder,$rootScope,EventInterval,DateHelpers,EventsDurationHolder) {

        return {
            restrict: 'E',
            templateUrl : '/partials/directives/event-duration-directive.html',
            scope : {
                event : "=",
                endTimeRange : "@",
                minStartTime : "=",
                maxStartTime : "="
            },
            replace : true,
            controller : function($scope){
                // ---------- Init timepicker ---------//
                $scope.timeFormat = 'HH:mm';
                $scope.interval = EventInterval;
                $scope.endTimeRange = 1000 * 60 * 60 * 6;
                $scope.durations = EventsDurationHolder;

                var setDurationLabel = function(){
                    if(!$scope.event) return;
                    var startTimeMoment = moment( $scope.event.startTime);
                    var endTimeMoment = moment( $scope.event.endTime);
                    $scope.durationLabel = Math.ceil(endTimeMoment.diff(startTimeMoment) / 1000) / 60;
                };


                setDurationLabel();
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
                    var newEndTimeMoment = startTimeMoment.clone().add($scope.durationLabel, 'minutes');
                    $scope.event.endTime = new Date(newEndTimeMoment.format(FullDateFormat));
                    $timeout(setDurationLabel);
                }


            },
            link : function(scope, element, attrs){
                attrs.$observe('endTimeRange', function(newVal){
                    if(newVal) scope.endTimeRange = newVal;
                });
            }
        };
    }]);