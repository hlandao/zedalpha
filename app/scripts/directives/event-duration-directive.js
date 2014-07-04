var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives
    .directive('hlEventDurationSelect', ['$timeout','FullDateFormat', 'EventsDurationForGuestsHolder','$rootScope','EventInterval','DateHelpers', function ($timeout, FullDateFormat, EventsDurationForGuestsHolder,$rootScope,EventInterval,DateHelpers) {

        return {
            restrict: 'E',
            templateUrl : '/partials/directives/hl-event-duration-select.html',
            scope : {
                event : "=event",
                durations : "=durations"
            },
            controller : function($scope){
                // ---------- Init timepicker ---------//
                $scope.timeFormat = 'HH:mm';
                $scope.interval = EventInterval;
                $scope.defaultFMOptions = {
                    style : 'dropdown',
                    startOfTheDay : moment('00:00',$scope.timeFormat),
                    endOfTheDay : moment('23:59',$scope.timeFormat),
                    interval : moment.duration($scope.interval,'minutes')
                }



                // ----------- setters ---------//
                var setStartTimeHelperModel = function(){
                    var startTimeMoment = moment( $scope.event.startTime);
                    startTimeMoment.minute(DateHelpers.findClosestIntervalToDate(startTimeMoment)).second(0);
                    $scope.startTimeHelperModel = moment(startTimeMoment,$scope.timeFormat);
                }


                var setEndTimeHelperModel = function(){
                    var endTimeMoment = moment( $scope.event.endTime);
                    endTimeMoment.minute(DateHelpers.findClosestIntervalToDate(endTimeMoment)).second(0);
                    $scope.endTimeHelperModel = endTimeMoment;
                }


                var setDurationLabel = function(){
                    var startTimeMoment = moment( $scope.event.startTime);
                    var endTimeMoment = moment( $scope.event.endTime);
                    $scope.durationLabel = Math.ceil(endTimeMoment.diff(startTimeMoment) / 1000) / 60;
                };


                var updateAllViewInputs = function(){
                    setStartTimeHelperModel();
                    setEndTimeHelperModel();
                    setDurationLabel();
                }

                updateAllViewInputs();
                // --------------- Init everything else --------------//

                $scope.changeDate = function(){
                    // changing the date in the view changes the start time, hence we need to update the endTime accordingly
                    // duration should stay the same.
                    var dayOfYear = moment($scope.event.startTime).dayOfYear();
                    var newEndTimeMoment = moment($scope.event.endTime).dayOfYear(dayOfYear);
                    $scope.event.endTime = new Date(newEndTimeMoment.format(FullDateFormat));
                    $timeout(updateAllViewInputs);
                };


                $scope.changeStartTime = function(){
                    // change the start time should affect the end time (keeping the duration flat)
                    var newStartTimeMoment = moment($scope.event.startTime);
                    updateEventMomentWithHour(newStartTimeMoment, $scope.startTimeHelperModel);
                    var newEndTimeMoment = newStartTimeMoment.clone().add($scope.durationLabel, 'minutes');
                    $scope.event.startTime = new Date(newStartTimeMoment.format(FullDateFormat));
                    $scope.event.endTime = new Date(newEndTimeMoment.format(FullDateFormat));
                    $timeout(updateAllViewInputs);
                };

                $scope.changeEndTime = function(){
                    // changing the end time only affects the duration
                    var newEndTimeMoment = moment($scope.event.endTime);
                    updateEventMomentWithHour(newEndTimeMoment, $scope.endTimeHelperModel);
                    $scope.event.endTime = new Date(newEndTimeMoment.format(FullDateFormat));
                    $timeout(updateAllViewInputs);
                }


                $scope.changeDuration = function(duration){
                    $scope.durationLabel = duration;
                    var startTimeMoment = moment($scope.event.startTime);
                    var newEndTimeMoment = startTimeMoment.add($scope.durationLabel, 'minutes');
                    $scope.event.endTime = new Date(newEndTimeMoment.format(FullDateFormat));
                    $timeout(updateAllViewInputs);
                }

                // -------------------- Helpers ---------------//
                var updateEventMomentWithHour = function(momentObject, hourMomentObject){
                    momentObject.set('hour',hourMomentObject.hour()).set('minute',hourMomentObject.minute());
                }

            },
            link : function(scope, element, attrs) {
            }
        };
    }])
    .directive('hlEventEndTimeDurationSelect', ['$timeout','FullDateFormat', 'EventsDurationForGuestsHolder','$rootScope', function ($timeout, FullDateFormat, EventsDurationForGuestsHolder,$rootScope) {

        return {
            restrict: 'E',
            template : '<select ng-model="selectedDuration" data-test="{{selectedDuration}}" ng-options="k as k for (k,v) in durations"></select>',
            require:['ngModel'],
            scope : {
                startTime : "=startTime",
                durations : "=durations"
            },
            link : function(scope, element, attrs, ctrls) {
                    var ngModel = ctrls[0];



                scope.$watch('startTime', function(newVal){
                    if(newVal){
                        if(!ngModel.$viewValue){
                            ngModel.$setViewValue(calcDuration(ngModel.$modelValue));
                            ngModel.$render();
                        }else{
                            ngModel.$setViewValue(ngModel.$viewValue);
                        }

                    }
                });



                scope.$watch('selectedDuration', function(newVal){
                    ngModel.$setViewValue(newVal);
                });

                var calcDuration = function(modelValue){
                    if(!scope.startTime || !modelValue) return null;

                    var startTimeMoment = moment(scope.startTime);
                    var endTimeMoment = moment(modelValue);

                    var durationInMiliSeconds = endTimeMoment.diff(startTimeMoment, 'millisecond') + 1;
                    var durationInMinutes = Math.ceil(durationInMiliSeconds/1000/60);

                    return durationInMinutes;

                };

                ngModel.$formatters.push(calcDuration);

                ngModel.$render = function(){
                    scope.selectedDuration = ngModel.$viewValue;
                };



                ngModel.$parsers.push(function(viewValue){
                    if(viewValue && scope.startTime)
                        return endTimeFromDuration(viewValue);
                });

                var endTimeFromDuration = function(duration){
                    var startTimeMoment = moment(scope.startTime);
                    var newEndTimeMoment = startTimeMoment.add('minutes', duration);
                    return new Date(newEndTimeMoment.format(FullDateFormat));
                };



            }
        };
    }]);