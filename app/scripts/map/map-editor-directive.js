var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives
    .directive('map', function(firebaseRef, UserHolder, $timeout) {
        return {
            restrict: 'E',
            replace : true,
            templateUrl : '/partials/map/map-editor.html',
            link: function(scope, elem, attrs) {
                var mapRef, map, businessId,canvas, objModified;
                var grid=50, snappingGrid=grid/4;

                canvas = sharedCanvasResources.createTheCanvas();



                sharedCanvasResources.listenToContainerScrollWithCanvas(canvas);
                attrs.$observe('businessId', function(val){
                    UserHolder.promise().then(function(){
                        if(UserHolder.auth){
                            businessId = val;
                            mapRef = firebaseRef('users/' +UserHolder.auth.uid + '/businesses/'+businessId+'/map');
                            mapRef.once('value', function(snapshot){
                                map = snapshot.val();
                                renderMap(map);
                            });

                        }
                    })

                });

                var renderMap = function(map){
                    if(map){
                        canvas.loadFromJSON(JSON.stringify(map), function(){
//                            sharedCanvasResources.removeBgIfAlreadyAdded(canvas);
//                            sharedCanvasResources.addBGToCanvas(canvas);
                            canvas.calcOffset();
                            canvas.renderAll();
                        });
                    }else{
                        for (var i = 0; i < (canvas.width / grid); i++) {
                            canvas.add(new fabric.Line([ i * grid, 0, i * grid, canvas.width], {
                                stroke: '#f8f8f8',
                                selectable: false,
                                hasBorders : false,
                                hasControls : false,
                                lockRotation : true,
                                lockScalingX : true,
                                lockMovementX : true,
                                lockMovementY : true
                            }));
                            canvas.add(new fabric.Line([ 0, i * grid, canvas.width, i * grid], {
                                stroke: '#f8f8f8',
                                selectable: false,
                                hasBorders : false,
                                hasControls : false,
                                lockRotation : true,
                                lockScalingX : true,
                                lockMovementX : true,
                                lockMovementY : true

                            }));
                        }

//                        sharedCanvasResources.addBGToCanvas(canvas);
                    }
                };


                scope.seatConfigs = {
                    'BAR_CHAIR' : {
                        name : 'BAR_CHAIR',
                        drawingDefaults : {
                            shape : 'triangle',
                            shapeOptions : {width:35, height:30},
                            textOptions : {fontSize: 10},
                            groupOptions : {lockRotation : true, lockUniScaling : true,hasRotatingPoint :false}
            }
                    },
                    'SQUARE_TABLE_FOR_2' :  {
                        name : 'SQUARE_TABLE_FOR_2',
                        drawingDefaults : {
                            shape : 'rect',
                            shapeOptions : {width:34, height:34},
                            textOptions : {fontSize: 15}
                        }
                    },

                    'CIRCLE_TABLE_FOR_2' : {
                        name : 'CIRCLE_TABLE_FOR_2',
                        drawingDefaults : {
                            shape : 'circle',
                            shapeOptions : {radius : 17},
                            textOptions : {fontSize: 15},
                            groupOptions : {lockRotation : true, lockUniScaling : true,hasRotatingPoint :false}
                        }
                    },

                    'SQUARE_TABLE_FOR_4' :  {
                        name : 'SQUARE_TABLE_FOR_4',
                        drawingDefaults : {
                            shape : 'rect',
                            shapeOptions : {width:50, height:50},
                            textOptions : {fontSize: 18}
                        }
                    },

                    'CIRCLE_TABLE_FOR_4' : {
                        name : 'CIRCLE_TABLE_FOR_4',
                        drawingDefaults : {
                            shape : 'circle',
                            shapeOptions : {radius : 25},
                            textOptions : {fontSize: 18},
                            groupOptions : {lockRotation : true, lockUniScaling : true,hasRotatingPoint :false}
                        }
                    },

                    'RECT_TABLE_FOR_6' :  {
                        name : 'SQUARE_TABLE_FOR_6',
                        drawingDefaults : {
                            shape : 'rect',
                            shapeOptions : {width:100, height:50},
                            textOptions : {fontSize: 18}
                        }
                    },

                    'CIRCLE_TABLE_FOR_6' : {
                        name : 'CIRCLE_TABLE_FOR_6',
                        drawingDefaults : {
                            shape : 'circle',
                            shapeOptions : {radius : 40},
                            textOptions : {fontSize: 18},
                            groupOptions : {lockRotation : true, lockUniScaling : true,hasRotatingPoint :false}
                        }
                    },

                    'RECT_TABLE_FOR_8' :  {
                        name : 'SQUARE_TABLE_FOR_8',
                        drawingDefaults : {
                            shape : 'rect',
                            shapeOptions : {width:150, height:50},
                            textOptions : {fontSize: 18}
                        }
                    },

                    'CIRCLE_TABLE_FOR_8' : {
                        name : 'CIRCLE_TABLE_FOR_8',
                        drawingDefaults : {
                            shape : 'circle',
                            shapeOptions : {radius : 50},
                            textOptions : {fontSize: 18},
                            groupOptions : {lockRotation : true, lockUniScaling : true,hasRotatingPoint :false}
                        }
                    },

                    'CIRCLE_TABLE_FOR_10' : {
                        name : 'CIRCLE_TABLE_FOR_10',
                        drawingDefaults : {
                            shape : 'circle',
                            shapeOptions : {radius : 60},
                            textOptions : {fontSize: 18},
                            groupOptions : {lockRotation : true, lockUniScaling : true,hasRotatingPoint :false}
                        }
                    },

                    'BLOCK' : {
                        name : 'BLOCK',
                        drawingDefaults : {
                            shape : 'block',
                            shapeOptions : {width : 20, height:100},
                            groupOptions : {}
                        }
                    },









                };
//
//
                canvas.on('mouse:up', function(){
                    if(objModified)
                        scope.saveMap();

                });

                canvas.on('object:modified', function(e){
                    objModified = true;
                });

                canvas.on('object:selected', function(e){
                    console.log('e',e);
                        scope.$apply(function(){
                           scope.selectedShape = e.target;
                        });
                });

                canvas.on('selection:cleared', function(e){
                    $timeout(function(){
                        scope.selectedShape = null;
                    });
                });

                canvas.on('object:moving', function(options) {
                    options.target.set({
                        left: Math.round(options.target.left / snappingGrid) * snappingGrid,
                        top: Math.round(options.target.top / snappingGrid) * snappingGrid
                    });
                });



                scope.updateShape = function(shape){
                    shape.setSeatNumber(shape.newSeatNumber);
                    canvas.renderAll();
                    scope.selectedShape = null;
                    scope.saveMap();
                };

                scope.removeShape = function(shape){
                    canvas.remove(shape);
                    scope.selectedShape = null;
                    scope.saveMap();
                };

                scope.addSeat = function(newSeat){
                    if(newSeat.seatConfig.type != 'block' && !newSeat.seatNumber && newSeat.seatNumber !== 0){
                        scope.err = "Please enter seat number";
                    }else if(!newSeat.seatConfig || !newSeat.seatConfig.drawingDefaults){
                        scope.err = "Please select seat type";
                    }
                    var shape = seatShapeFactory(newSeat.seatNumber, newSeat.seatConfig.drawingDefaults);
                    canvas.add(shape);
                    canvas.renderAll();
                    newSeat = {seatNumber : ++newSeat.seatNumber};
                    scope.saveMap();
                };

                scope.saveMap = function(){
                    objModified = false;
                    var json = canvas.toJSON(['bgImage','normalState']);
                    for(var i = 0; i< json.objects.length;++i){
                        if(json.objects[i].bgImage){
                            json.objects.splice(i,1);
                        } else if(json.objects[i].snappingLine){
                            json.objects.splice(i,1);
                        }
                    }
                    mapRef.set(json, function(error){
                        scope.$apply(function(){
                            if(error){
                                scope.err = "Error occurred while saving map.";
                            }else{
                                scope.msg = "Map saved!";
                                $timeout(function(){
                                    scope.msg = "";
                                }, 3500);
                            }
                        });

                    });
                }
            }
        };
    });

