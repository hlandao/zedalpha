var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);

zedAlphaDirectives
    .directive('shiftOrganizer', function($timeout, BusinessHolder, $rootScope, EventsStatusesHolder, $filter, DateHolder, EventsSeatsHolder, TimelyFilteredEvents, ShiftsDayHolder) {
        return {
            restrict: 'E',
            replace : true,
            templateUrl : '/partials/directives/shift-organizer-directive.html',
            scope : {
                shift : "="
            },
            controller : function($scope){
                var tdWidth = 20;

                $scope.$watch('shift', function(newVal){
                    $scope.hours = extractHoursFromShift(newVal);
                });


                var extractHoursFromShift = function(shift){
                    var startTimeMoment = moment(shift.startTime).seconds(0),
                        endTimeMoment = moment(shift.endTime).seconds(0),
                        output = [];

                    while (endTimeMoment.diff(startTimeMoment, 'minutes') > 0){
                        output.push(startTimeMoment.format('HH'));
                        startTimeMoment.add('hours', 1);
                    }

                    return output;
                }

                var renderEventsSeats = function(){
                    var output = {};
                    $scope.eventsBySeats = null;
                    $timeout(function(){
                        angular.forEach(EventsSeatsHolder.seats, function(seatId, seatNumer){
                            angular.forEach(TimelyFilteredEvents.filteredEvents, function(event){
                                output[seatNumer] = output[seatNumer] || [];
                                if(event.seats[seatNumer]){
                                    output[seatNumer].push(event);
                                }
                            });
                        });
                        $scope.eventsBySeats = output;
                    });
                };

                $scope.$watch(function(){
                    return EventsSeatsHolder;
                }, renderEventsSeats, true);


                $scope.$watch(function(){
                    return TimelyFilteredEvents;
                }, renderEventsSeats, true);

            },
            link : function(scope, elem, attrs) {

            }
        }
    }).directive('shiftOrganizerEvent', function($timeout){
        return {
            restrict: 'A',
            replace : true,
            link :function(scope, element, attrs){
                var $table =  $(element).parent().parent().parent().parent().eq(0),
                    $tr = $table.find('thead').find('td').eq(2);


                var calcShiftLengthInMinutes = function(){
                    return shiftEndTimeMoment.diff(shiftStartTimeMoment, 'minutes');
                }

                var cellWidth,
                    shiftStartTimeMoment,
                    shiftEndTimeMoment,
                    shiftLengthInMinutes,
                    eventStartTimeMoment,
                    eventEndTimeMoment;

                var setLeft = function(){
                    var startTimeDiffMinutes = eventStartTimeMoment.diff(shiftStartTimeMoment, 'minutes');
                    var left = startTimeDiffMinutes/shiftLengthInMinutes * scope.hours.length * cellWidth;
                    console.log('startTimeDiffMinutes',startTimeDiffMinutes,'shiftLengthInMinutes',shiftLengthInMinutes,scope.event.seats,startTimeDiffMinutes/shiftLengthInMinutes,cellWidth);
                    element.css({right : left + 'px'});
                }

                var setWidth = function(){
                    var eventLength = eventEndTimeMoment.diff(eventStartTimeMoment, 'minutes');
                    var width = eventLength / shiftLengthInMinutes * scope.hours.length * cellWidth;
                    element.css({width : width + 'px'});
                }

                var setColor = function(){
                    element.css({backgroundColor : scope.event.status.color});
                }

                var initVars = function(){
                    cellWidth = $tr.outerWidth();
                    shiftStartTimeMoment = moment(scope.shift.startTime);
                    shiftEndTimeMoment = moment(scope.shift.endTime);
                    shiftLengthInMinutes = calcShiftLengthInMinutes();
                    eventStartTimeMoment = moment(scope.event.startTime);
                    eventEndTimeMoment = moment(scope.event.endTime);
                }

                $timeout(function(){
                    initVars();
                    setLeft();
                    setWidth();
                    setColor();
                });

            }
        }
    });
