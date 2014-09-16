
var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);

zedAlphaDirectives
    .directive('hlHeaderTimepicker', function ($timeout, DateHelpers, FullDateFormat, ShiftsDayHolder, $rootScope, $parse, $filter, EventsCollection, DateHolder) {
        return {
            restrict : 'E',
            replace : false,
            template : '<input hl-timepicker ng-model="DateHolder.currentClock" settings="{min : ShiftsDayHolder.selectedShift.startTime, range : calculatedRange}">',
            link : function(scope, element, attrs){
                var calcRange = function(){
                    var latest = EventsCollection.latestEvent, latestDiff, clockDiff;
                    if(latest && ShiftsDayHolder.selectedShift){
                        latestDiff = EventsCollection.latestEvent.data.startTime.diff(ShiftsDayHolder.selectedShift.startTime, 'minutes');
                        clockDiff = DateHolder.currentClock.diff(ShiftsDayHolder.selectedShift.startTime, 'minutes');
                        scope.calculatedRange = Math.max(ShiftsDayHolder.selectedShift.duration, latestDiff);
                        if(clockDiff > 0 && clockDiff > scope.calculatedRange){
                            scope.calculatedRange = clockDiff + (2 * 60);
                        }

                            }else if(ShiftsDayHolder.selectedShift){
                        scope.calculatedRange = ShiftsDayHolder.selectedShift.duration;
                    }
                }

                $rootScope.$watch(function(){
                    return EventsCollection.latestEvent && ShiftsDayHolder.selectedShift;
                },calcRange);
            }
        }
    });
