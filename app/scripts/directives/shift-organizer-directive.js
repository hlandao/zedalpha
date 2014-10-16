var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);

zedAlphaDirectives
    .directive('shiftOrganizer', function($timeout, BusinessHolder, $rootScope, $filter, ShiftsDayHolder, SeatsHolder, EventsCollection) {
        return {
            restrict: 'E',
            replace : true,
            templateUrl : '/partials/directives/shift-organizer-directive.html',
            scope : {
                shift : "="
            },
            controller : function($scope){
                $scope.$watch('shift', function(newVal){
                    $scope.hours = extractHoursFromShift(newVal);
                });


                var extractHoursFromShift = function(shift){
                    var output = [],
                        startTime = shift.startTime.clone(),
                        latestEventByEndTime = findLatestEventByEndTime(),
                        durationByLatestEvent = latestEventByEndTime.data.endTime.diff(startTime, 'minutes'),
                        durationInMinutes = Math.max(shift.duration,durationByLatestEvent),
                        durationInHours = durationInMinutes / 60;

                    while (durationInHours >= 0){
                        output.push(startTime.format('HH'));
                        startTime.add('hours', 1);
                        --durationInHours;
                    }

                    $scope.durationInMinutes = durationInMinutes;
                    return output;
                }

                var findLatestEventByEndTime = function(){
                    var events = EventsCollection.sorted.nowEvents;
                    var currentEvent, output = null;
                    if(events && events.length){
                        for (var i = 0; i< events.length; ++i) {
                            currentEvent = events[i];
                            output = output ? (currentEvent.data.endTime.isAfter(output.data.endTime,'minutes') ? currentEvent : output) : currentEvent ;
                        }
                    }

                    return output;
                }

                var renderEventsSeats = function(){
                    var output = {};
                    $scope.eventsBySeats = null;
                    $timeout(function(){
                        angular.forEach(SeatsHolder.seats, function(seatId, seatNumer){
                            if(!seatNumer || seatNumer == 'undefined') return;
                            output[seatNumer] = output[seatNumer] || [];
                            angular.forEach(EventsCollection.sorted.nowEvents, function(event){
                                if(event.data.seats[seatNumer]){
                                    output[seatNumer].push(event);
                                }
                            });
                        });

                        $scope.eventsBySeats = output;
                    });
                };

                $scope.$watch(function(){
                    return SeatsHolder;
                }, renderEventsSeats, true);


                $scope.$watch(function(){
                    return EventsCollection.sorted;
                }, renderEventsSeats, true);

            },
            link : function(scope, elem, attrs) {

            }
        }
    }).directive('shiftOrganizerEvent', function($timeout, BusinessHolder){
        return {
            restrict: 'A',
            replace : true,
            link :function(scope, element, attrs){
                var cellWidth,
                    shiftStartTimeMoment,
                    shiftEndTimeMoment,
                    shiftDurationInMinutes;


                var $table =  $(element).parent().parent().parent().parent().eq(0),
                    $tr = $table.find('thead').find('td').eq(2);


                var setLeft = function(){
                    var startTimeDiffMinutes = scope.event.data.startTime.diff(shiftStartTimeMoment, 'minutes');
                    var left = startTimeDiffMinutes/shiftDurationInMinutes * scope.hours.length * cellWidth;
                    element.css({right : left + 'px'});
                }

                var setWidth = function(){
                    var eventLength = scope.event.$getDuration();
                    var width = eventLength / shiftDurationInMinutes * scope.hours.length * cellWidth;
                    element.css({width : width + 'px'});
                }

                var setColor = function(){
                    var status = findStatusByStatus(scope.event.data.status);
                    element.css({backgroundColor : status.color});
                }

                var findStatusByStatus = function(status){
                    return _.findWhere(BusinessHolder.business.eventsStatuses, {status : status});
                }
                var initVars = function(){
                    cellWidth = $tr.outerWidth();
                    shiftStartTimeMoment = scope.shift.startTime;
                    shiftEndTimeMoment = scope.shift.startTime.clone().add(scope.durationInMinutes, 'minutes');
                    shiftDurationInMinutes = scope.durationInMinutes;
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
