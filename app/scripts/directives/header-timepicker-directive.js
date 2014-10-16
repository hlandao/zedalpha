
var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);

zedAlphaDirectives
    .directive('hlHeaderTimepicker', function ($timeout, DateHelpers, FullDateFormat, ShiftsDayHolder, $rootScope, $parse, $filter, EventsCollection, DateHolder) {
        return {
            restrict : 'E',
            replace : false,
            template : '<input hl-timepicker ng-model="DateHolder.currentClock" settings="{min : ShiftsDayHolder.selectedShift.startTime, range : calculatedRange}">',
            link : function(scope, element, attrs){

                var calcRange = function(){
                    scope.calculatedRange = ShiftsDayHolder.selectedShift.duration;
                }

                $rootScope.$on('$EventsCollectionUpdated', calcRange);

                $rootScope.$watch(function(){
                    return  ShiftsDayHolder.selectedShift;
                },calcRange, true);
            }
        }
    }).directive('entireShiftButton', function($filter){
        return function(scope, element, attrs){
            var regularText = 'ENTIRE_SHIFT', hoveredText = 'BACK';
            element.text($filter('translate')(regularText));
            element.on('mouseover', function(){
                $(this).text($filter('translate')(hoveredText));
            });

            element.on('mouseout', function(){
                $(this).text($filter('translate')(regularText));
            })

            scope.$on('$destroy', function(){
                element.off('mouseout mouseover');
            })
        }
    });
