var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);

zedAlphaDirectives
    .directive('mapManager', function(firebaseRef, BusinessHolder, $timeout, DateHolder, EventsStatusesHolder) {
        return {
            restrict: 'E',
            replace : true,
            templateUrl : '/partials/map/map-manager.html',
            link: function(scope, elem, attrs) {
                var $mapRef,
                    map,
                    businessId,
                    bgImage,
                    canvas,
                    buttonDefault = {
                        hasBorders : false,
                        hasControls : false,
                        lockRotation : true,
                        lockScalingX : true,
                        lockMovementX : true,
                        lockMovementY : true,
                        visible : false
                    },
                    occasionalButton,
                    destinationButton,
                    selectedShapes=[];

                // ------- Init Canvas and Map --------//
                canvas = sharedCanvasResources.createTheCanvas();
                canvas.hoverCursor = 'pointer';
                sharedCanvasResources.listenToContainerScrollWithCanvas(canvas);

                // init map db connection
                $mapRef = BusinessHolder.$business.$child('map').$on('loaded', function(){
                    $mapRef.$off('loaded');
                    map = $mapRef;
                    renderMap(map);
                });

                // render map for the first time (after getting map from db)
                var renderMap = function(map){
                    if(map){
                        canvas.loadFromJSON(JSON.stringify(map), function(){
//                            sharedCanvasResources.removeBgIfAlreadyAdded(canvas);
//                            bgImage =sharedCanvasResources.addBGToCanvas(canvas);
                            addButtons();
                            angular.forEach(canvas._objects, function(shape){
                                if(shape.type=="seatShape") shape.setToStatic();
                            });
                            renderMapWithEvents(scope.$parent.events);
                            canvas.renderAll();
                        });
                    }else{
//                        bgImage = sharedCanvasResources.addBGToCanvas(canvas);
                        addButtons();
                    }

                    setBGImageListeners();
                };

                var addButtons = function(){
                    fabric.Image.fromURL('images/walkin.png', function(oImg) {
                        occasionalButton = oImg;
                        occasionalButton.name = "occasional";
                        canvas.add(occasionalButton);
                    },angular.extend(buttonDefault, {type: "button"}));

                    fabric.Image.fromURL('images/dest.png', function(oImg) {
                        destinationButton = oImg;
                        destinationButton.name = "destination";
                        canvas.add(destinationButton);
                    }, angular.extend(buttonDefault, { type: "button"}));
                };


                // ----- Canvas Listeners ------ //
                var setBGImageListeners = function(){
                    canvas.on('mouse:up', function(e){
                        var target = e.target;
                        if(!isAddingNewEvent()){
                            clickHandlerForNormalState(target,e);
                        }else{
                            clickHandlerForAddingNewEventState(target,e);
                        }
                    });
                }

                var clickHandlerForAddingNewEventState = function (target, e){
                    if(!target) return;
                    if(~selectedShapes.indexOf(target)){
                        if(isShapeInFilteredEvents(target)){
                            return;
                        }
                        removeShapeFromShapes(target);
                        updateNewEventSeats();
                    }else{
                        target.selectNormal();
                        addShapeToShapes(target);
                        updateNewEventSeats();
                    }
                    canvas.renderAll();
                };

                // click handler for normal state
                var clickHandlerForNormalState = function(target, e){
                    if(target && !target.bgImage){
                        if(target.type == 'seatShape'){
                            if(isShapeInFilteredEvents(target)){
                                return;
                            }
                            target.selectNormal();
                            showButtonsNearShape(target);
                            addShapeToShapes(target);
                        }else if(target.type == 'button'){
                            newEventForSelectedShaped(target.name);
                        }
                    }else{
                        unSelectAllShapes();
                        hideButtons();
                    }
                    canvas.renderAll();
                }

                // -------- Map Helpers -------//
                var addShapeToShapes = function(shape, render){
                    $timeout(function(){
                        selectedShapes.push(shape);
                    });
                    if(render) canvas.renderAll();
                };


                var removeShapeFromShapes = function(shape, render){
                    selectedShapes = _.without(selectedShapes, shape);
                    shape.backToNormalState();
                    if(render) canvas.renderAll();
                };


                var showButtonsNearShape = function(shape){
                    occasionalButton.setTop(shape.top - (occasionalButton.height/2-shape.height/2));
                    occasionalButton.setLeft(shape.left-occasionalButton.width);
                    occasionalButton.setVisible(true);
                    occasionalButton.setCoords();
                    destinationButton.setTop(shape.top - (occasionalButton.height/2-shape.height/2));
                    destinationButton.setLeft(shape.left+shape.width);
                    destinationButton.setVisible(true);
                    destinationButton.setCoords();

                };

                var unSelectAllShapes = function(render){
                    angular.forEach(selectedShapes, function(shape){
                        shape.backToNormalState();
                    });

                    $timeout(function(){
                        selectedShapes = [];
                    });
                    if(render) canvas.renderAll();
                };

                var hideButtons = function(){
                    occasionalButton.setVisible(false);
                    destinationButton.setVisible(false);
                };


                // ------- Sync with Events Ctrl --------//
                var isAddingNewEvent = function(){
                    return scope.$parent.newEvent;
                }

                var updateNewEventSeats = function (){
                    $timeout(function(){
                        scope.$parent.newEvent.seats = shapesArrToSeatsDic();
                    },1);
                }

                var newEventForSelectedShaped = function(occasionalOrDestination){
                    scope.$apply(function(){
                        scope.$parent.newEventWithSeatsDic(occasionalOrDestination, shapesArrToSeatsDic());
                    });
                    hideButtons();
                };
                
                var shapesArrToSeatsDic = function(){
                    var output = {};
                    angular.forEach(selectedShapes, function(shape){
                        if(shape.type == "seatShape"){
                            output[shape.seatNumber] = true;
                        }
                    });
                    return output;
                }

                var newEventWatcher = scope.$parent.$watch('newEvent', function(newVal, oldVal){
                    // new Event was closed -  unselect all shapes
                    if(!newVal && oldVal){

                        unSelectAllShapes(true);
                    }
                });


                var renderMapWithEvents = _.throttle(function(newVal){
                    if(!newVal) return;
                    var events = newVal.events;
                    if(events){
                        setAllShapesToNormal();
                        if(!events.length){
                            return canvas.renderAll();
                        }

                        var event, color, seatNumber, theShape;
                        for(var j = 0; j < events.length; ++j){
                            event = events[j];
                            color = getEventStatusColor(event.status);
                            for(seatNumber  in  event.seats){
                                for (var i = 0;i < canvas._objects.length; ++i){
                                    theShape = canvas._objects[i];
                                    if(theShape.type == 'seatShape' && theShape.seatNumber == seatNumber){

                                        theShape.setBackgroundColor(color);
                                    }
                                }

                            }

                        }
                        canvas.renderAll();

                    }
                },10);

                var filteredEventsWatcher = scope.$parent.$watch('events', renderMapWithEvents,true);


                var setAllShapesToNormal = function(){
                    var theShape;
                    for (var i = 0;i < canvas._objects.length; ++i){
                        theShape = canvas._objects[i];
                        if(theShape.type == 'seatShape'){
                            theShape.backToNormalState();
                        }
                    }
                }

                var isShapeInFilteredEvents = function(shape){
                    var event;
                    for( var i = 0; i < scope.$parent.events.events.length; ++i){
                        event = scope.$parent.events.events[i];
                        for(var seatNumber in event.seats){
                            if(seatNumber == shape.seatNumber){
                                return true;
                            }
                        }
                    }
                    return false;
                }



                var getEventStatusColor = function(status){
                    var statusObj;

                    for (var i in EventsStatusesHolder){
                        statusObj = EventsStatusesHolder[i];
                        if(statusObj.status == status.status){
                            return statusObj.color;
                        }
                    }
                    return null;
                }


                // -------- $destory -------//

                scope.$on('$destroy', function(){
                    newEventWatcher();
                });
            }
        };
    });

