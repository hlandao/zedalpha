var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);

zedAlphaDirectives
    .directive('shiftOrganizer', function($timeout, BusinessHolder, $rootScope, $filter, ShiftsDayHolder, SeatsHolder, EventsCollection, DateHelpers) {
        return {
            restrict: 'E',
            replace : true,
            templateUrl : '/partials/directives/shift-organizer-directive.html',
            scope : {
                shift : "="
            },
            controller : function($scope){


                var extractHoursFromShift = function(shift){
                    var output = [],
                        startTime = shift.startTime.clone(),
                        theHour = parseInt(startTime.format('H'), 10),
                        latestEventByEndTime = findLatestEventByEndTime(),
                        durationByLatestEvent = latestEventByEndTime ? latestEventByEndTime.data.endTime.diff(startTime, 'minutes') : 0,
                        durationInMinutes = Math.max(shift.duration,durationByLatestEvent),
                        durationInHours =  (durationInMinutes / 60);

                    while (durationInHours > 0){
                        output.push(DateHelpers.addLeadingZeroToHour(theHour));
                        ++theHour;
                        if(theHour == 24) theHour  = 0;
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
//                    var output = {};
//                    $scope.eventsBySeats = null;
//                    $timeout(function(){
//                        angular.forEach(SeatsHolder.seats, function(seatId, seatNumer){
//                            if(!seatNumer || seatNumer == 'undefined') return;
//                            output[seatNumer] = output[seatNumer] || [];
//                            angular.forEach(EventsCollection.sorted.nowEvents, function(event){
//                                if(event.data.seats && event.data.seats[seatNumer]){
//                                    output[seatNumer].push(event);
//                                }
//                            });
//                        });
//
//                        $scope.eventsBySeats = output;
//                    });
                    $scope.eventsBySeats = [];
                    $scope.seats = [];
                    angular.forEach(SeatsHolder.seats, function(seatId, seatNumber){
                        if(!seatNumber || seatNumber == 'undefined') return;
                        $scope.seats.push(seatNumber);
                     });
                    angular.forEach(EventsCollection.sorted.nowEvents, function(event){
                        angular.forEach(event.data.seats, function(val, seatNumber){
                            if(val){
                                $scope.eventsBySeats.push({
                                    seatNumber : seatNumber,
                                    event : event
                                })
                            }
                        });
                    });



                };

                $scope.$watch(function(){
                    return SeatsHolder;
                }, renderEventsSeats, true);


                $rootScope.$on('$EventsCollectionUpdated', function(){
                    renderEventsSeats();
                });

                $scope.$watch('shift', function(newVal){
                    $scope.hours = extractHoursFromShift(newVal);
                    renderEventsSeats();
                });


            },
            link : function(scope, elem, attrs) {

            }
        }
    }).directive('shiftOrganizerEvent', function($timeout, BusinessHolder){
        return {
            restrict: 'A',
            replace : true,
            link :function(scope, element, attrs, ctrls){
                var leftOffset,
                    topOffset,
                    cellWidth,
                    cellHegiht,
                    shiftStartTimeMoment,
                    shiftEndTimeMoment,
                    shiftDurationInMinutes;


                var $table,
                    $tdBody;


                var setLeft = function(){
                    var startTimeDiffMinutes = scope.event.event.data.startTime.diff(shiftStartTimeMoment, 'minutes');
                    var left = leftOffset + (startTimeDiffMinutes/shiftDurationInMinutes * scope.hours.length * cellWidth);

                    element.css({right : left + 'px'});
                }


                var setTop = function(){
                    var seatNumber = "" + scope.event.seatNumber;
                    var index = scope.seats.indexOf(seatNumber);
                    var top = topOffset + ((index+1) * cellHegiht);
                    element.css({top : top + 'px'});
                }


                var setWidth = function(){
                    var eventLength = scope.event.event.$getDuration();
                    var width = eventLength / shiftDurationInMinutes * scope.hours.length * cellWidth;
                    element.css({width : width + 'px'});
                }

                var setColor = function(){
                    var status = findStatusByStatus(scope.event.event.data.status);
                    element.css({backgroundColor : status.color});
                }

                var setDrag = function(){
                }

                var findStatusByStatus = function(status){
                    return _.findWhere(BusinessHolder.business.eventsStatuses, {status : status});
                }
                var initVars = function(){
                   $table =  $(element).parent().parent().find('table').eq(0);
//                    $tdHead = $table.find('thead').find('td').eq(2),
                   $tdBody = $table.find('tbody').find('td').eq(2);

                    cellWidth = $tdBody.outerWidth();
                    cellHegiht =  $tdBody.outerHeight();
                    topOffset = cellHegiht + -1 * (cellHegiht*0.75);
                    leftOffset = cellWidth;


                    shiftStartTimeMoment = scope.shift.startTime;
                    shiftEndTimeMoment = scope.shift.startTime.clone().add(scope.durationInMinutes, 'minutes');
                    shiftDurationInMinutes = scope.hours.length * 60;
                }

                $timeout(function(){
                    initVars();
                    setLeft();
                    setTop();
                    setWidth();
                    setColor();
                    setDrag();
                });

                scope.clickOnEvent = function(event, e){
                    scope.$emit('$clickOnEvent', event.event);
                }

                scope.$on('$destory', function(){
                    element.off('mousedown','mouseup').parents().on('mousemove');
                });

            }
        }
    });
