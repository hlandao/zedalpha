
var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);

zedAlphaDirectives
    .directive('hlHeaderTimepicker', function ($timeout, DateHelpers, FullDateFormat, ShiftsDayHolder, $rootScope, $parse, $filter, EventsCollection) {
        return {
            restrict : 'E',
            replace : false,
            template : '<input hl-timepicker ng-model="DateHolder.currentClock" settings="{min : ShiftsDayHolder.selectedShift.startTime, range : calculatedRange}">',
            link : function(scope, element, attrs){
                var calcRange = function(){
                    var latest = EventsCollection.latestEvent, latestDiff;
                    if(latest && ShiftsDayHolder.selectedShift && ShiftsDayHolder.selectedShift.name == 'ENTIRE_DAY'){
                        latestDiff = EventsCollection.latestEvent.data.startTime.diff(ShiftsDayHolder.selectedShift.startTime, 'minutes');
                        scope.calculatedRange = Math.max(ShiftsDayHolder.selectedShift.duration, latestDiff);
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
