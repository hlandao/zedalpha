var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);



zedAlphaDirectives
    .directive('mapManager', function(firebaseRef, UserHolder, $timeout, BusinessHolder, $rootScope, $filter, DateHolder, ShiftsDayHolder, EventsCollection, EventTimesCheck) {
        return {
            restrict: 'E',
            replace : true,
            templateUrl : '/partials/map/map-manager.html',
            scope : {
              business : "=",
              businessId : "=",
            },
            link: function(scope, elem, attrs) {
                var container = $("#map"),
                    $seatMenu = $('#seat-menu').appendTo('body');
                var paper = Raphael('map', container.width(), container.height());
                var panZoom = paper.panzoom({ initialZoom: 4, initialPosition: { x: 0, y: 0} }),
                    shapes = [];
                var sortedEventsWatcher,
                    events;


                var EventsStatusesHolder = BusinessHolder.business.eventsStatuses;

                scope.highlightedShapes = [];
                panZoom.enable();
                paper.safari();

                $(window).resize(function(){
                    paper.setSize(container.width(), container.height());
                })

                container.click(function(){
                    scope.$apply(function(){
                        if(isAddingNewEvent()){
                           return;
                        }
                        angular.forEach(scope.highlightedShapes, function(shape){
                            shape.cancelHighlight();
                        });
                        renderMapWithEvents();
                        scope.highlightedShapes = [];
                        hideSeatMenu();

                    });
                });


                $("#map-container #up").click(function (e) {
                    panZoom.zoomIn(1);
                    e.preventDefault();
                });

                $("#map-container #down").click(function (e) {
                    panZoom.zoomOut(1);
                    e.preventDefault();
                });


                var clickCallback  = function(shape){
                    if(!shape.seatNumber) return;
                    scope.$apply(function(){
                        if(isAddingNewEvent()){
                            console.log('Clicked on event while adding new event');
                            clickHandlerForAddingNewEventState(shape);
                        } else if(isEditingEvent()){
                            console.log('Clicked on event while editing existing event');
                            clickHandlerForEditingEventState(shape);
                        }else{
                            console.log('Clicked on event');
                            clickHandlerForNormalState(shape);
                        }
                    });
                };


                var clickHandlerForAddingNewEventState = function(shape){
                    var index = scope.highlightedShapes.indexOf(shape);
                    if(index == -1){
                        if(shapeSeatIsAvailable(shape)){
                            scope.highlightedShapes.push(shape);
                            shape.highlight();
                        }
                    }else if(index > -1){
                        scope.highlightedShapes.splice(index,1);
                        shape.cancelHighlight();
                    }
                    updateNewEventSeats();
                    renderMapWithEvents();
                }

                var clickHandlerForEditingEventState = function(shape){
                    var index = scope.highlightedShapes.indexOf(shape);
                    if(index == -1){
                        if(shapeSeatIsAvailable(shape)){
                            scope.highlightedShapes.push(shape);
                            shape.highlight();
                        }
                    }else if(index > -1){
                        scope.highlightedShapes.splice(index,1);
                        shape.cancelHighlight();
                    }
                    updateEditedEventSeats();
                }

                var clickHandlerForNormalState = function(shape){
                    var index = scope.highlightedShapes.indexOf(shape);
                    if(!shape.highlighted && index == -1){
                        if(!shapeSeatIsAvailable(shape)){
                            renderMapWithEvents();
                            scope.highlightedShapes = [];
                        }else{
                            var l = scope.highlightedShapes.length;
                            if(l > 0 && !shapeSeatIsAvailable(scope.highlightedShapes[l-1])){
                                renderMapWithEvents();
                                scope.highlightedShapes = [];
                            }
                        }
                        shape.toggleHighlight();
                        scope.highlightedShapes.push(shape);
                    }else if(index != -1){
                        shape.toggleHighlight();
                        scope.highlightedShapes.splice(index,1);
                    }

                    if(!scope.highlightedShapes.length){
                        hideSeatMenu();
                    }else{
                        positionSeatMenu(shape);
                    }
                    eventsForHighlightedShapes();
                }


                var eventsForHighlightedShapes = function(){
                    scope.nextEventInXMinutes = null;
                    if(scope.highlightedShapes.length == 1){

                        var highlightedShapesEvents,
                            seats = scope.highlightedShapes[0].seatObject();



                        highlightedShapesEvents = $filter('eventsBySeats')(EventsCollection.collection, seats);


                        highlightedShapesEvents = $filter('eventsByShift')(highlightedShapesEvents);


                        scope.highlightedEvents = $filter('sortDayEvents')(highlightedShapesEvents, DateHolder.currentClock, null, null, true, true);

                        if(!scope.highlightedEvents.nowEvents.length && scope.highlightedEvents.upcomingEvents.length){
                            scope.nextEventInXMinutes = scope.highlightedEvents.upcomingEvents[0].data.startTime.diff(DateHolder.currentClock, 'seconds');
                            if(scope.nextEventInXMinutes >  3600 * 6){
                                scope.nextEventInXMinutes = null;
                            }else if(scope.nextEventInXMinutes <= 0){
                                scope.nextEventInXMinutes = null;
                            }
                        }


                    }else{
                        emptyEventsForHighlightedShapes();
                    }
                }

                var emptyEventsForHighlightedShapes = function(){
                    scope.highlightedEvents = null;
                    scope.nextEventInXMinutes = null;
                }


                var hideSeatMenu = function(){
                    $seatMenu.hide();
                }

                var positionSeatMenu = function(shape){
                    if(!shapeSeatIsAvailable(shape)){
                        scope.highlightedIsntAvailable = true;
                    }else{
                        scope.highlightedIsntAvailable = false;
                    }
                    var l = scope.highlightedShapes.length;
                    if(l){
                        var lastShape = scope.highlightedShapes[l-1],
                            bbox = lastShape.getBBox(),
                            shape = lastShape.shapesSet[0],
                            zoom = ((panZoom.getCurrentZoom() * 0.1) + 1.2),
                            zoomPosition = panZoom.getCurrentPosition(),
                            x = ((bbox.x+bbox.width - zoomPosition.x) * zoom) + 25,
                            y = ((bbox.y - zoomPosition.y) * zoom);
                        $seatMenu.css({top : y + 'px', left : x+'px', display:'block'});
                    }

                }

                var shapeSeatIsAvailable = function(shape){
                    var seatNumber = shape.seatNumber, event,seatNumberToCheck;
                    if(EventsCollection.sorted.nowEvents){
                        for(var j = 0; j < EventsCollection.sorted.nowEvents.length; ++j){
                            event = EventsCollection.sorted.nowEvents[j];
                            for(seatNumberToCheck  in  event.data.seats){
                                if(seatNumberToCheck == seatNumber) return false;
                            }
                        }
                    }
                    return true;
                }

                var setAllShapesToNormal = function(){
                    angular.forEach(shapes, function(shape){
                        shape.normalState();
                    });
                };

                var getEventStatusColor = function(status){
                    var statusObj;
                    for (var i in EventsStatusesHolder){
                        statusObj = EventsStatusesHolder[i];
                        if(statusObj.status == status){
                            return statusObj.color;
                        }
                    }
                    return null;
                }


                scope.newEventForSelectedShaped = function(occasionalOrDestination,e){
                    e.preventDefault();
                    scope.$parent.newEventWithSeatsDic(occasionalOrDestination, shapesArrToSeatsDic(), null, shapesArrToSeatingOptions());
                    hideSeatMenu();
                    $timeout(renderMapWithEvents,10);
                };

                var shapesArrToSeatsDic = function(){
                    var output = {};
                    angular.forEach(scope.highlightedShapes, function(shape){
                        output[shape.seatString()] = true;
                    });
                    return output;
                }


                var shapesArrToSeatingOptions = function(){
                    var output = {}
                    angular.forEach(scope.highlightedShapes, function(shape){
                        angular.extend(output, shape.seatingOptions);
                    });
                    return output;

                }


                // ------- Sync with Events Ctrl --------//
                var isAddingNewEvent = function(){
                    return scope.$parent.newEvent;
                }

                var isEditingEvent = function(){
                    return scope.$parent.editedEvent;
                }

                var isSwitchingEvents = function(){
                    return scope.$parent.switchMode;
                }



                var updateNewEventSeats = function (){
                    scope.$parent.newEvent.data.seats = shapesArrToSeatsDic();
                }


                var updateEditedEventSeats = function (){
                    scope.$parent.editedEvent.data.seats = shapesArrToSeatsDic();
                }



                var isNowEvent = function(event){

                }

                var renderMapWithEvents = _.throttle(function(newVal){
                    var nowEvents = angular.copy(EventsCollection.sorted.nowEvents),
                        upcomingEvents = EventsCollection.sorted.upcomingEvents;


                    if(scope.$parent.newEvent){
                        var newEventTimeCheck = EventTimesCheck(scope.$parent.newEvent, DateHolder.currentClock);
                        if(newEventTimeCheck.isNowEvent){
                            nowEvents = nowEvents || [];
                            nowEvents.push(scope.$parent.newEvent);
                        }
                    }

                    if(scope.$parent.editedEvent){
                        var editedEventTimeCheck = EventTimesCheck(scope.$parent.editedEvent, DateHolder.currentClock);
                        if(editedEventTimeCheck.isNowEvent){
                            nowEvents = nowEvents || [];
                            nowEvents.push(scope.$parent.editedEvent);
                        }
                    }


                    setAllShapesToNormal();
                    scope.highlightedShapes = [];

                    if((!nowEvents || !nowEvents.length) && (!upcomingEvents || !upcomingEvents.length)){
                        return;
                    }


                    var event, color, seatNumber, theShape, seatsWithBackground = {},seatsWithUpcomingBackground = {}, highlightedSeats = {}, upcomingHighlightedShapes = {};
                    angular.forEach(nowEvents, function(event){
                        color = getEventStatusColor(event.data.status);
                        for(seatNumber  in  event.data.seats){
                            seatsWithBackground[seatNumber] = color;
                            if(event.$isEditing() || event.$isNew()){
                                highlightedSeats[seatNumber] = true;
                            }

                        }
                    });

                    angular.forEach(upcomingEvents, function(event){
                        color = getEventStatusColor(event.data.status);
                        for(seatNumber  in  event.data.seats){
                            if(!seatsWithBackground[seatNumber]) seatsWithUpcomingBackground[seatNumber] = color;
                            if(event.$isEditing()){
                                highlightedSeats[seatNumber] = true;
                            }
                        }
                    });


                    for (var i = 0;i < shapes.length; ++i){
                        theShape = shapes[i];
                        if(theShape.seatNumber){
                            theShape.normalState();
                            seatNumber = theShape.seatNumber;
                            color = seatsWithBackground[seatNumber];
                            if(color){
                                theShape.setBackgroundColor(color);
                            }
                            color = seatsWithUpcomingBackground[seatNumber];
                            if(color){
                                theShape.setBackgroundColorWithOpacity(color, 0.4);
                            }
                            if(highlightedSeats[seatNumber]){
                                theShape.highlight();
                                scope.highlightedShapes.push(theShape);
                            }
                        }

                    }


                    hideSeatMenu();

                },5,{trailing : true});




                var renderMapJson = function(map){
                    paper.fromJSON(map, function(el, data){
                        for(var i in data){
                            el.data(i, data[i]);
                        }
                    });
                    var sortedSeats = {};
                    var decorativeShapes = {};
                    paper.forEach(function(el){
                        var data = el.data();
                        if(!data || !data.type){
                            el.remove();
                            return;
                        }
                        var seatId = el.data('seatId');
                        var seatNumber = el.data('seatNumber');

                        if(seatId && seatNumber){
                            sortedSeats[seatId] = sortedSeats[seatId] || [];
                            sortedSeats[seatId].push(el);
                        }else if (seatId){
                            decorativeShapes[seatId] = decorativeShapes[seatId] || [];
                            decorativeShapes[seatId].push(el);
                        }


                    });

                    for(var i in sortedSeats){
                        shapes.push(new SeatShape(paper, {
                            shapeObject : null,
                            seatNumber : null,
                            shapesArr :  sortedSeats[i],
                            clickCallback : clickCallback,
                            FTEnabled : false
                        }));
                    }

                    for(var i in decorativeShapes){
                        shapes.push(new DecorativeShape(paper, {
                            shapeObject : null,
                            seatNumber : null,
                            shapesArr :  decorativeShapes[i],
                            FTEnabled : false
                        }));
                    }

                };


                var newEventWatcher = scope.$parent.$watch('newEvent', function(newVal, oldVal){
                    if(!newVal && oldVal){
                        renderMapWithEvents();
                    }
                });

                var editEventWatcher = scope.$parent.$watch('editedEvent', function(newVal, oldVal){
                    if(!newVal && oldVal){
                        renderMapWithEvents();
                    }

                });


                renderMapJson(BusinessHolder.business.map);
                sortedEventsWatcher = scope.$watch(function(){
                    return EventsCollection.sorted;
                }, renderMapWithEvents,true);


            }
        };
    }).filter('highlightedShapesSeats', function(){
        return function(arr){
            var output = "";
            for (var i = 0; i < arr.length; ++i){
                if(output) output += ", ";
                output += arr[i].seatString();
            }
            return output;
        }
    });

