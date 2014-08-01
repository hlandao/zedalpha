var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);

function ShapeGroup(paper, options){
    var self = this;
    this.paper = paper;
    this.changeCallback = options.changeCallback;
    this.dragStartCallback = options.dragStartCallback;
    this.dragEndCallback = options.dragEndCallback;


    if(options.shapesArr){
        this.shapesArr = options.shapesArr;
        this.groupSet = paper.set();
        for (var i = 0 ; i  <  options.shapesArr.length; ++i){
            options.shapesArr[i].isPartOfGroup = true;
            options.shapesArr[i].hideHandles();
            this.groupSet.push(options.shapesArr[i].shapesSet);
        }

        this.setFT();

        this.groupSet.click(function(e){
            e.stopPropagation();
            e.preventDefault();
            return false;
        })

    }else{
        return false;
    }
};

ShapeGroup.prototype.setFT = function(){
    var paper = this.paper, self = this;
    if(this.ft && this.ft.unplug) this.ft.unplug();
    this.ft = paper.freeTransformAdjusted(this.groupSet, { keepRatio: true, scale : [], draw : ['bbox'], rotate : [], drag:['self']}, function(data,events){
        if(events.indexOf('drag start') > -1){
            self.dragStartCallback && self.dragStartCallback(self);
        } else if(events.indexOf('drag end') > -1){
            self.changeCallback && self.changeCallback(self);
            self.dragEndCallback && self.dragEndCallback(self);
        }
    }).showHandles();
}


ShapeGroup.prototype.hideHandles = function(){
    for (var i = 0; i < this.shapesArr.length; ++i){
        this.shapesArr[i].isPartOfGroup = false;
        this.shapesArr[i].setFT();
    }
    this.ft.unplug();
    this.groupSet.clear();
}

ShapeGroup.prototype.addSet = function(newSet){
    newSet.hideHandles();
    this.groupSet.push(newSet.shapesSet);
    this.shapesArr.push(newSet);
    this.setFT();
}

ShapeGroup.prototype.seatString = function(){
    var output = "";
    for (var i = 0; i < this.shapesArr.length; ++i){
        if(output) output += ', ';
        output += this.shapesArr[i].seatNumber;
    }
    return output;
}

ShapeGroup.prototype.removeFromPaper = function(){
    this.ft.unplug();
    this.groupSet.remove();
    for (var i = 0; i < this.shapesArr.length; ++i){
        this.shapesArr[i].removeFromPaper();
    }
}


function SeatShape(paper, options){
    var self = this;
    this.paper = paper;
    this.shapeObject = options.shapeObject;
    this.seatNumber = options.seatNumber;
    this.shapesArr = options.shapesArr;
    this.changeCallback = options.changeCallback;
    this.selectCallback = options.selectCallback;
    this.deselectCallback = options.deselectCallback;
    this.dragStartCallback = options.dragStartCallback;
    this.dragEndCallback = options.dragEndCallback
    this.clickCallback = options.clickCallback;
    this.FTEnabled = options.FTEnabled;
    this.id = this.generateId();
    this.defaultX = 100;
    this.defaultY = 100;
    this.normalFillColor = "#eee";
    this.normalStrokeColor = "#ddd";
    this.normalStateAttrs = {'fill' : this.normalFillColor, 'stroke-width' : 1, stroke : '#ddd'};
    this.textColor = "#E87352";
    this.highlightFillColor = "#31C0BE";
    this.highlightStrokeColor = "#31C0BE";
    this.highlightStateAttrs = {'stroke-width' : 2, stroke : this.highlightStrokeColor};



    if(this.shapeObject){
        this.initFromObjectAndSeatNumber();
    }else if(this.shapesArr){
        this.initFromShapesArr();
    }

    this.setFT();

    this.shapesSet.click(function(e){
        e.stopPropagation();
        e.preventDefault();
        if(self.isPartOfGroup){
            return;
        }

        if(self.FTEnabled){
            if(self.isDragging){
                self.isDragging = false;
                return false;
            }
            if(!self.handlesOn){
                self.handlesOn = true;
                self.ft.showHandles();
                self.selectCallback && self.selectCallback(self);
            }else{
                self.handlesOn = false;
                self.ft.hideHandles();
                self.deselectCallback && self.deselectCallback(self);
            }
            return
        }else{
            self.clickCallback(self);
        }



    });

};


SeatShape.prototype.setFT = function(){
    if(!this.FTEnabled) return;
    var paper = this.paper, self = this;
    if(this.ft && this.ft.unplug) this.ft.unplug();
    this.ft = paper.freeTransformAdjusted(this.shapesSet, { keepRatio: true, scale : ['bboxCorners'], draw : ['bbox'], rotate : ['axisX'], drag : ['self']}, function(data,evetns){
        if(self.isPartOfGroup){
            return;
        }
        self.throttledCallback(data, evetns);
    }).hideHandles();

}

SeatShape.prototype.throttledCallback = _.throttle(function(data,events){
    var self = this;
    if(events.indexOf('drag start') > -1 || events.indexOf('rotate start') > -1 || events.indexOf('scale start') > -1){
        this.isDragging = true;
        self.dragStartCallback && self.dragStartCallback(self);
    }else if(events.indexOf('drag end') > -1 || events.indexOf('rotate end') > -1 || events.indexOf('scale end') > -1){
        this.changeCallback && this.changeCallback(this);
        self.dragEndCallback && self.dragEndCallback(self);
    }
}, 100, {trailing : true});


SeatShape.prototype.initFromObjectAndSeatNumber = function(paper, shapeObject, seatNumber){
    this.shapesSet = this.paper.set();
    var shapeObject = this.shapeObject,
        defaultX = this.defaultX,
        defaultY = this.defaultY;

    if(!shapeObject || !shapeObject){
        return;
    }else if(shapeObject.shapeType == 'circle'){
        this.shape = this.paper.circle(defaultX, defaultY, shapeObject.r).attr(this.normalStateAttrs);
        this.text = this.setTextShape(defaultX, defaultY);
    }else if(shapeObject.shapeType === 'rect'){
        this.shape = this.paper.rect(defaultX, defaultY, shapeObject.w, shapeObject.h).attr(this.normalStateAttrs);
        this.text = this.setTextShape((defaultX+shapeObject.w/2), (defaultY+shapeObject.h/2));
    }else if(shapeObject.shapeType == 'roundedRect'){
        this.shape = this.paper.roundedRect(defaultX, defaultY, shapeObject.w, shapeObject.h, 5, 5, 0, 0).attr(this.normalStateAttrs);
        this.text = this.setTextShape((defaultX+shapeObject.w/2), (defaultY+shapeObject.h/2));
    }

    this.shape.data('seatId', this.id);
    this.shape.data('type','SeatShapeTheShape');
    this.shape.data('seatNumber',this.seatNumber);

    this.text.data('seatId', this.id);
    this.text.data('type','SeatShapeTheShape');
    this.text.data('seatNumber',this.seatNumber);


    this.shapesSet.push(this.shape);
    this.shapesSet.push(this.text);
    this.shapesSet.data('seatId', this.id);
    this.shapesSet.data('type','SeatShape');
    this.shapesSet.data('seatNumber',this.seatNumber);


}

SeatShape.prototype.initFromShapesArr = function(){
    var seatNumber, seatId;
    this.shapesSet = this.paper.set();
    var arr = this.shapesArr;
  for (var i = 0 ; i  <  arr.length; ++i){
      seatNumber = this.seatNumber || seatNumber || arr[i].data('seatNumber');
      seatId = seatId || arr[i].data('seatId');
      this.shapesSet.push(arr[i]);
  }
    this.shape = this.shapesSet[0];
    this.text = this.shapesSet[1];
    this.id = seatId;
    this.seatNumber = seatNumber;
    this.shapesSet.data('seatId', seatId);
    this.shapesSet.data('type','SeatShape');
    this.shapesSet.data('seatNumber',seatNumber);

};

SeatShape.prototype.generateId = function ()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};


SeatShape.prototype.setTextShape = function(x, y){
    return this.paper.text(x, y, "" + this.seatNumber + "").attr({fill: this.textColor}).attr('isTransformable', 0);
};

SeatShape.prototype.hideHandles = function(){
    this.handlesOn = false;
    this.ft.hideHandles();
}

SeatShape.prototype.seatString = function(){
    return this.seatNumber;
}

SeatShape.prototype.updateSeatNumber = function(){
    this.shapesSet.data('seatNumber', this.seatNumber);
    this.shapesSet[0].data('seatNumber', this.seatNumber);
    this.shapesSet[1].data('seatNumber', this.seatNumber);
    this.shapesSet[1].attr({text : "" + this.seatNumber + ""});
}

SeatShape.prototype.removeFromPaper = function(){
    this.ft.unplug();
    this.shapesSet.remove();
}

SeatShape.prototype.generateShapesArr = function(){
    return [this.shape, this.text];
}

SeatShape.prototype.translate = function(x,y){
    this.ft.attrs.x = x;
    this.ft.attrs.y = y;
    this.ft.apply();
    this.ft.updateHandles();
};

SeatShape.prototype.highlight = function(){
    this.highlighted = true;
    this.shape.attr(this.highlightStateAttrs);
};

SeatShape.prototype.cancelHighlight = function(){
    this.highlighted = false;
    this.shape.attr(this.normalStateAttrs);
};

SeatShape.prototype.toggleHighlight = function(){
    if(this.highlighted){
        this.cancelHighlight();
    }else{
        this.highlight();
    }
};

SeatShape.prototype.normalState = function(){
    this.cancelHighlight();
};

SeatShape.prototype.setBackgroundColor = function(color){
    this.shape.attr({fill : color});
};


SeatShape.prototype.getBBox = function(){
    return this.shape.getBBox();
};

Raphael.fn.roundedRect = function (x, y, w, h, r1, r2, r3, r4){
    var array = [];
    array = array.concat(["M",x,r1+y, "Q",x,y, x+r1,y]); //A
    array = array.concat(["L",x+w-r2,y, "Q",x+w,y, x+w,y+r2]); //B
    array = array.concat(["L",x+w,y+h-r3, "Q",x+w,y+h, x+w-r3,y+h]); //C
    array = array.concat(["L",x+r4,y+h, "Q",x,y+h, x,y+h-r4, "Z"]); //D
    return this.path(array);
};


zedAlphaDirectives
    .directive('mapManager', function(firebaseRef, UserHolder, $timeout, BusinessHolder, $rootScope, EventsStatusesHolder) {
        return {
            restrict: 'E',
            replace : true,
            templateUrl : '/partials/map/map-manager.html',
            scope : {
              business : "=",
              businessId : "=",
              filteredEvents : "="
            },
            link: function(scope, elem, attrs) {
                var container = $("#map"),
                    $seatMenu = $('#seat-menu');
                var paper = Raphael('map', container.width(), container.height());
                var panZoom = paper.panzoom({ initialZoom: 4, initialPosition: { x: 0, y: 0} }),
                    shapes = [];
                scope.highlightedShapes = [];
                panZoom.enable();
                paper.safari();


                container.click(function(){
                    scope.$apply(function(){
                        angular.forEach(scope.highlightedShapes, function(shape){
                            shape.cancelHighlight();
                        });
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
                    scope.$apply(function(){
                        if(shapeSeatIsAvailable(shape)){
                            shape.toggleHighlight();
                            var index = scope.highlightedShapes.indexOf(shape);
                            if(shape.highlighted && index == -1){
                                scope.highlightedShapes.push(shape);
                            }else if(index != -1){
                                scope.highlightedShapes.splice(index,1);
                            }
                            if(!scope.highlightedShapes.length){
                                hideSeatMenu();
                            }else{
                                positionSeatMenu();
                            }

                        }else{
                        }
                    });
                };

                var hideSeatMenu = function(){
                    $seatMenu.hide();
                }

                var positionSeatMenu = function(){
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
                    for(var j = 0; j < scope.filteredEvents.events.length; ++j){
                        event = scope.filteredEvents.events[j];
                        for(seatNumberToCheck  in  event.seats){
                            if(seatNumberToCheck == seatNumber) return false;
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
                        if(statusObj.status == status.status){
                            return statusObj.color;
                        }
                    }
                    return null;
                }


                var renderMapWithEvents = _.throttle(function(newVal){
                    if(!newVal) return;
                    var events = newVal.events;
                    if(events){
                        setAllShapesToNormal();
                        scope.highlightedShapes = [];
                        if(!events.length){
                            return;
                        }
                        var event, color, seatNumber, theShape;
                        for(var j = 0; j < events.length; ++j){
                            event = events[j];
                            color = getEventStatusColor(event.status);
                            for(seatNumber  in  event.seats){
                                for (var i = 0;i < shapes.length; ++i){
                                    theShape = shapes[i];
                                    if(theShape.id){
                                        console.log('theShape.seatNumber, seatNumber',theShape.seatNumber, seatNumber);
                                        if(theShape.seatNumber == seatNumber){
                                            theShape.setBackgroundColor(color);
                                            if(event.helpers && event.helpers.isEditing){
                                                theShape.highlight();
                                                scope.highlightedShapes.push(theShape);
                                            }
                                        }

                                    }

                                }

                            }

                        }
                    }
                },10,{trailing : true});


                var filteredEventsWatcher = scope.$watch('filteredEvents', renderMapWithEvents,true);


                var $mapRef = BusinessHolder.$business.$child('map').$on('loaded', function(){
                    $mapRef.$off('loaded');
                    if($mapRef.$value){
                        renderMapJson($mapRef.$value);
                    }
                });


                var renderMapJson = function(map){

                    paper.fromJSON(map, function(el, data){
                        for(var i in data){
                            el.data(i, data[i]);
                        }
                    });

                    var sortedSeats = {};
                    paper.forEach(function(el){
                        var data = el.data();
                        if(!data || !data.type){
                            el.remove();
                            return;
                        }
                        var seatId = el.data('seatId');
                        if(seatId){
                            sortedSeats[seatId] = sortedSeats[seatId] || [];
                            sortedSeats[seatId].push(el);
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
                };


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
    }).directive('mapEditor', function(firebaseRef, UserHolder, $timeout, BusinessHolder, $rootScope) {
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
                    {shapeName : 'BIG_CIRCLE', shapeType : 'circle', r  : 20},
                    {shapeName : 'BIG_RECT', shapeType : 'rect', w  : 40, h : 40},
                    {shapeName : 'CHAIR', shapeType : 'roundedRect', w  : 20, h:20}
                ];

                scope.selectNewShape = function(shape){
                    scope.selectedNewShape = shape;
                };

                var shapes = [];

                scope.addShape = function(){
                    if(!scope.selectedNewShape) return;
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
                        $mapRef.$set(json);
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

                var $mapRef = BusinessHolder.$business.$child('map').$on('loaded', function(){
                    $mapRef.$off('loaded');
                    if($mapRef.$value){
                        renderMapJson($mapRef.$value);
                    }
                });


                var renderMapJson = function(map){
                    paper.fromJSON(map, function(el, data){
                        for(var i in data){
                            el.data(i, data[i]);
                        }
                    });
                    var sortedSeats = {};
                    paper.forEach(function(el){
                        var data = el.data();
                        if(!data || !data.type){
                            el.remove();
                            return;
                        }
                        var seatId = el.data('seatId');
                        if(seatId){
                            sortedSeats[seatId] = sortedSeats[seatId] || [];
                            sortedSeats[seatId].push(el);
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
                };


            }
        };
    });

