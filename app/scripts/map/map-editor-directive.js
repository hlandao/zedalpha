var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives
    .directive('map', function(firebaseRef, UserHolder, $timeout) {
        return {
            restrict: 'E',
            templateUrl : 'partials/map/map-editor.html',
            link: function(scope, elem, attrs) {
                var mapRef, map, businessId,canvas, objModified;

                canvas = new fabric.Canvas('canvas', {backgroundColor: 'rgb(240,240,240)'});


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
                        console.log(map);
//                        console.log(JSON.parse(map));
                        canvas.loadFromJSON(JSON.stringify(map), canvas.renderAll.bind(canvas));
                    }

                };

                scope.seatConfigs = {
                    'Chair' : {
                        name : 'chair',
                        drawingDefaults : {
                            shape : 'circle',
                            circleOptions : {radius : 25},
                            textOptions : {fontSize: 25},
                            groupOptions : {}
                        }
                    },
                    'Table' :  {
                        name : 'table',
                        drawingDefaults : {
                            shape : 'rect'
                        }
                    }
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
                    if(!newSeat.seatNumber && newSeat.seatNumber !== 0){
                        scope.err = "Please enter seat number";
                    }else if(!newSeat.seatConfig.drawingDefaults){
                        scope.err = "Please select seat type";
                    }
                    var shape = seatShapeFactory(newSeat.seatNumber, newSeat.seatConfig.drawingDefaults);
                    canvas.add(shape);
                    canvas.renderAll();
                    newSeat = {seatNumber : ++newSeat.seatNumber};
                    scope.saveMap();
                };

                scope.saveMap = function(){
                    console.log('scope.saveMap');
                    objModified = false;
                    var json = canvas.toJSON([]);
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

