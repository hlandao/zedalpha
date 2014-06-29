var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);

zedAlphaDirectives
    .directive('mapManager', function(firebaseRef, BusinessHolder, $timeout, DateHolder) {
        return {
            restrict: 'E',
            templateUrl : 'partials/map/map-manager.html',
            link: function(scope, elem, attrs) {
                var $mapRef,
                    map,
                    businessId,
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
//                    destinationButton = new LabeledRect({
//                        label : 'Destination',
//                        fill : '#add8e6',
//                        hasBorders : false,
//                        hasControls : false,
//                        lockRotation : true,
//                        lockScalingX : true,
//                        lockMovementX : true,
//                        lockMovementY : true,
//                        width:100,
//                        height:30,
//                        visible : false
//                    });
                    occasionalButton,
                    destinationButton;





                var selectedShapes=[];

                canvas = new fabric.Canvas('canvas', {backgroundColor: 'rgb(240,240,240)'});
                canvas.hoverCursor = 'pointer';

                $mapRef = BusinessHolder.$business.$child('map').$on('loaded', function(){
                    $mapRef.$off('loaded');
                    map = $mapRef;
                    renderMap(map);
                });


                var renderMap = function(map){
                    if(map){
                        canvas.loadFromJSON(JSON.stringify(map), function(){
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


                            canvas.renderAll();
                            angular.forEach(canvas._objects, function(shape){
                                if(shape.type=="seatShape") shape.setToStatic();
                            });

                        });
                    }
                };


                canvas.on('mouse:up', function(e){
                   var target = e.target;
                    if(!isAddingNewEvent()){
                        clickHandlerForNormalState(target,e);
                    }else{
                        clickHandlerForAddingNewEventState(target,e);
                    }
                });

                var clickHandlerForAddingNewEventState = function (target, e){
                    if(!target) return;
                    if(~selectedShapes.indexOf(target)){
                        scope.$apply(function(){
                            scope.$parent.newEvent.seats = shapesArrToSeatsDic();
                        });
                    }else{
                        target.selectNormal();
                        $timeout(function(){
                            selectedShapes.push(target);
                        });
                    }
                    canvas.renderAll();
                };

                var clickHandlerForNormalState = function(target, e){
                    if(target){
                        if(target.type == 'seatShape'){
                            target.selectNormal();
                            showButtonsNearShape(target);
                            $timeout(function(){
                                selectedShapes.push(target);
                            });
                        }else if(target.type == 'button'){
                            newEventForSelectedShaped(target.name);
                        }
                    }else{
                        angular.forEach(selectedShapes, function(shape){
                            shape.backToNormalState();
                        });

                        $timeout(function(){
                            selectedShapes = [];
                        });
                        hideButtons();
                    }
                    canvas.renderAll();
                }

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

                var hideButtons = function(){
                    occasionalButton.setVisible(false);
                    destinationButton.setVisible(false);
                };

                var isAddingNewEvent = function(){
                    return scope.$parent.newEvent;
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
            }
        };
    });

