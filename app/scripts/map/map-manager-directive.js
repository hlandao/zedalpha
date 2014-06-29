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
                    walkInButton,
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
                                walkInButton = oImg;
                                canvas.add(walkInButton);
                            },angular.extend(buttonDefault, {name : "walkInButton", type: "button"}));
                            fabric.Image.fromURL('images/dest.png', function(oImg) {
                                destinationButton = oImg;
                                canvas.add(destinationButton);
                            }, angular.extend(buttonDefault, {name : "destinationButton", type: "button"}));


                            canvas.renderAll();
                            angular.forEach(canvas._objects, function(shape){
                                if(shape.type=="seatShape") shape.setToStatic();
                            });

                        });
                    }
                };


                canvas.on('mouse:up', function(e){
                   var target = e.target;
                    console.log('target',target,e);
                    if(target){
                        if(target.type == 'seatShape'){
                            target.selectNormal();
                            showButtonsNearShape(target);
                            $timeout(function(){
                                selectedShapes.push(target);
                            });
                        }else if(target.type == 'button'){
                            if(target.name == "walkInButton"){
                                newEventForSelectedShaped();
                            }else if(target.text == "destinationButton"){

                            }
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
                });

                var showButtonsNearShape = function(shape){
                    walkInButton.setTop(shape.top - (walkInButton.height/2-shape.height/2));
                    walkInButton.setLeft(shape.left-walkInButton.width);
                    walkInButton.setVisible(true);
                    walkInButton.setCoords();
                    destinationButton.setTop(shape.top - (walkInButton.height/2-shape.height/2));
                    destinationButton.setLeft(shape.left+shape.width);
                    destinationButton.setVisible(true);
                    destinationButton.setCoords();

                };

                var hideButtons = function(){
                    walkInButton.setVisible(false);
                    destinationButton.setVisible(false);

                };
                
                var newEventForSelectedShaped = function(){
                    scope.newEventWithSeatsDic(shapesArrToSeatsDic());
                };
                
                var shapesArrToSeatsDic = function(){
                    var output = {};
                    angular.forEach(selectedShapes, function(shape){
                        if(shape.type == "seatShape"){
                            output[seatNumber] = true;
                        }
                    });
                    return output;
                }
            }
        };
    });

