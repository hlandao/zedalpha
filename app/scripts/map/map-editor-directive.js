var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);

zedAlphaDirectives
        .directive('mapEditor', function(firebaseRef, UserHolder, $timeout, BusinessHolder, $rootScope) {
        return {
            restrict: 'E',
            replace : true,
            templateUrl : '/partials/map/map-editor.html',
            scope : {
                business : "=",
                businessId : "="
            },
            link: function(scope, elem, attrs) {

                scope.shapes = [
                    {shapeName : 'CIRCLE_TABLE_2', shapeType : 'circle', r  : 20, isSeat : true},
                    {shapeName : 'CIRCLE_TABLE_4', shapeType : 'circle', r  : 30, isSeat : true},
                    {shapeName : 'CIRCLE_TABLE_6', shapeType : 'circle', r  : 40, isSeat : true},
                    {shapeName : 'CIRCLE_TABLE_8', shapeType : 'circle', r  : 50, isSeat : true},
                    {shapeName : 'CIRCLE_TABLE_10', shapeType : 'circle', r  : 60, isSeat : true},

                    {shapeName : 'SQUARE_TABLE_2', shapeType : 'rect', w  : 40, h : 40, isSeat : true},
                    {shapeName : 'SQUARE_TABLE_4', shapeType : 'rect', w  : 50, h : 50, isSeat : true},
                    {shapeName : 'RECT_TABLE_6', shapeType : 'rect', w  : 60, h : 40, isSeat : true},
                    {shapeName : 'RECT_TABLE_8', shapeType : 'rect', w  : 80, h : 60, isSeat : true},
                    {shapeName : 'CHAIR', shapeType : 'roundedRect', w  : 20, h:20, isSeat : true},
                    {shapeName : 'WALL', shapeType : 'rect', w  : 50, h:10, isSeat : false, attrs : {fill : '#e7d2bc', 'stroke-width' : '0'}}
                ];

                scope.selectNewShape = function(shape){
                    scope.selectedNewShape = shape;
                };

                var shapes = [];

                scope.addShape = function(){
                    if(!scope.selectedNewShape) return;
                    if(scope.selectedNewShape.isSeat){
                        shapes.push(new SeatShape(paper, {
                            shapeObject : scope.selectedNewShape,
                            seatNumber : scope.seatNumber,
                            shapesArr : null,
                            changeCallback : changeCallback,
                            selectCallback : selectCallback,
                            deselectCallback : deselectCallback,
                            dragStartCallback : dragStartCallback,
                            dragEndCallback : dragEndCallback,
                            FTEnabled : true
                        }));
                    }else{
                        shapes.push(new DecorativeShape(paper, {
                            shapeObject : scope.selectedNewShape,
                            shapesArr : null,
                            changeCallback : changeCallback,
                            selectCallback : selectCallback,
                            deselectCallback : deselectCallback,
                            dragStartCallback : dragStartCallback,
                            dragEndCallback : dragEndCallback,
                            FTEnabled : true
                        }));
                    }

                    scope.save();
                };


                scope.removeShape = function(shape){
                    var shapesArr = angular.isArray(shape) ? shape : [shape];
                    shape.removeFromPaper();
                    for(var i = 0;i < shapes.length; ++i){
                        for (var j = 0 ; j < shapesArr.length; ++j){
                            if(shapes[i] === shapesArr[j]){
                                shapes.splice(i--,1);
                            }

                        }
                    }
                    scope.save();
                    scope.selectedShape = null;
                };

                scope.seatNumberChanged = function(shape){
                    shape.updateSeatNumber();
                    scope.save();
                };

                var container = $("#map");
                var paper = Raphael('map', container.width(), container.height());
                var panZoom = paper.panzoom({ initialZoom: 4, initialPosition: { x: 0, y: 0} });
                panZoom.enable();
                paper.safari();

                $(window).resize(function(){
                    paper.setSize(container.width(), container.height());
                })


                container.click(function(){
                    scope.$apply(function(){
                        scope.selectedShape && scope.selectedShape.hideHandles();
                        angular.forEach(shapes, function(shape){
                            shape.hideHandles();
                            scope.selectedShape = null;
                        });
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


                var changeCallback = scope.save = function(shape){
                    $rootScope.safeApply(function(){
                        var jsonStr = paper.toJSON(function(el){
                            return el.data();
                        });

                        var arr = JSON.parse(jsonStr);
                        for (var i = 0; i < arr.length; ++i){
                            if(!arr[i].data || !arr[i].data.type){
                                arr.splice(i--, 1);
                            }
                        }

                        var json = JSON.stringify(arr);
                        BusinessHolder.business.map = json;
                        BusinessHolder.business.$save();
                    });
                };

                var selectCallback  = function(shape){
                    scope.$apply(function(){
                        if(scope.selectedShape){
                            if(scope.selectedShape.addSet){
                                scope.selectedShape.addSet(shape);
                            }else{
                                scope.selectedShape = new ShapeGroup(paper, {shapesArr : [scope.selectedShape, shape], changeCallback : changeCallback, dragStartCallback : dragStartCallback,dragEndCallback : dragEndCallback});
                            }

                        }else{
                            scope.selectedShape = shape;
                        }
                    });
                };


                var deselectCallback = function(){
                    scope.$apply(function(){
                        if(typeof scope.selectedShape != "ShapeGroup"){
                            scope.selectedShape = null;
                        }
                    });
                };

                var dragStartCallback = function(){
                    panZoom.disable();
                };


                var dragEndCallback = function(){
                    panZoom.enable();
                }




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
                            changeCallback : changeCallback,
                            selectCallback : selectCallback,
                            deselectCallback : deselectCallback,
                            dragStartCallback : dragStartCallback,
                            dragEndCallback : dragEndCallback,
                            FTEnabled : true
                        }));
                    }

                    for(var i in decorativeShapes){
                        shapes.push(new DecorativeShape(paper, {
                            shapeObject : null,
                            seatNumber : null,
                            shapesArr :  decorativeShapes[i],
                            changeCallback : changeCallback,
                            selectCallback : selectCallback,
                            deselectCallback : deselectCallback,
                            dragStartCallback : dragStartCallback,
                            dragEndCallback : dragEndCallback,
                            FTEnabled : true
                        }));
                    }

                };

                renderMapJson(BusinessHolder.business.map);



            }
        };
    });

