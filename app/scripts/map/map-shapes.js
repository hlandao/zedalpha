/**
 * ShapeGroup
 * used to move more a group of objects together.
 * only in the map editor.
 * @param paper
 * @param options
 * @returns {boolean}
 * @constructor
 */
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
    if(this.shapesArr.indexOf(newSet) == -1){
        this.groupSet.push(newSet.shapesSet);
        this.shapesArr.push(newSet);
        this.setFT();
    }
}

ShapeGroup.prototype.seatString = function(){
    var output = "";
    for (var i = 0; i < this.shapesArr.length; ++i){
        if(output) output += ',';
        output += this.shapesArr[i].seatNumber;
    }
    return output;
}

ShapeGroup.prototype.seatObject = function(){
    var output = {};
    for (var i = 0; i < this.shapesArr.length; ++i){
        output[this.shapesArr[i].seatNumber] = true;
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


/**
 * SeatShape
 * used for all kind of seats shapes
 * @param paper
 * @param options
 * @constructor
 */
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
    this.mouseoverCallback = options.mouseoverCallback;
    this.mouseoutCallback = options.mouseoutCallback;

    this.FTEnabled = options.FTEnabled;
    this.id = this.generateId();
    this.defaultX = 100;
    this.defaultY = 100;
    this.normalFillColor = "#eee";
    this.normalStrokeColor = "#ddd";
    this.normalStateAttrs = {'fill' : this.normalFillColor, 'fill-opacity' : 1.0, 'stroke-width' : 1, stroke : '#ddd'};
    this.textColor = "#E87352";
    this.highlightFillColor = "#31C0BE";
    this.highlightStrokeColor = "#31C0BE";
    this.highlightStateAttrs = {'stroke-width' : 2, stroke : this.highlightStrokeColor};
    this.hpverStrokeColor = "#444";
    this.hoverStateAttrs = {'stroke-width' : 2, stroke : this.hpverStrokeColor};




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

    this.shapesSet.touchend(function(e){
        alert(1);
    });


    this.shapesSet.mouseover(function(e){
        if(self.highlighted) return;
        self.prevMouseoverAttrs = $.extend({},self.shape.attrs);
        self.shape.attr(self.hoverStateAttrs);
        self.mouseoverCallback && self.mouseoverCallback(self);
    });

    this.shapesSet.mouseout(function(e){
        if(self.highlighted) return;
        self.shape.attr(self.prevMouseoverAttrs);
        self.prevMouseoverAttrs = null;
        self.mouseoutCallback && self.mouseoutCallback(self);
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
    var seatNumber, seatId, seatingOptions;
    this.shapesSet = this.paper.set();
    var arr = this.shapesArr;
    for (var i = 0 ; i  <  arr.length; ++i){
        seatNumber = this.seatNumber || seatNumber || arr[i].data('seatNumber');
        seatId = seatId || arr[i].data('seatId');
        seatingOptions = seatingOptions || arr[i].data('seatingOptions');
        this.shapesSet.push(arr[i]);
    }
    this.shape = this.shapesSet[0];
    this.text = this.shapesSet[1];
    this.id = seatId;
    this.seatNumber = seatNumber;
    this.seatingOptions = seatingOptions;
    this.shapesSet.data('seatId', seatId);
    this.shapesSet.data('type','SeatShape');
    this.shapesSet.data('seatNumber',seatNumber);
    this.shapesSet.data('seatingOptions',seatingOptions);
    this.cancelHighlight();
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

SeatShape.prototype.seatObject = function(){
    var output = {};
    output[this.seatNumber]= true;
    return output;
}


SeatShape.prototype.updateSeatNumber = function(){
    this.shapesSet.data('seatNumber', this.seatNumber);
    this.shapesSet[0].data('seatNumber', this.seatNumber);
    this.shapesSet[1].data('seatNumber', this.seatNumber);
    this.shapesSet[1].attr({text : "" + this.seatNumber + ""});
}

SeatShape.prototype.updateSeatingOptions = function(){
    this.shapesSet.data('seatingOptions', this.seatingOptions);
    this.shapesSet[0].data('seatingOptions', this.seatingOptions);
    this.shapesSet[1].data('seatingOptions', this.seatingOptions);
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

SeatShape.prototype.setBackgroundColorWithOpacity = function(color, opacity){
    this.shape.attr({'fill' : color, 'fill-opacity' : opacity});
};

SeatShape.prototype.getBBox = function(){
    return this.shape.getBBox();
};


/**
 * DecorativeShape
 * used for walls and other non-seats objects
 * @param paper
 * @param options
 * @constructor
 */
function DecorativeShape(paper, options){
    var self = this;
    this.paper = paper;
    this.shapeObject = options.shapeObject;
    this.shapesArr = options.shapesArr;
    this.changeCallback = options.changeCallback;
    this.selectCallback = options.selectCallback;
    this.deselectCallback = options.deselectCallback;
    this.dragStartCallback = options.dragStartCallback;
    this.dragEndCallback = options.dragEndCallback
    this.clickCallback = options.clickCallback;
    this.mouseoverCallback = options.mouseoverCallback;
    this.mouseoutCallback = options.mouseoutCallback;

    this.FTEnabled = options.FTEnabled;
    this.id = this.generateId();
    this.defaultX = 100;
    this.defaultY = 100;




    if(this.shapeObject){
        this.initFromObject();
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
            self.clickCallback && self.clickCallback(self);
        }

    });

    this.shapesSet.touchend(function(e){
    });


};


DecorativeShape.prototype.setFT = function(){
    if(!this.FTEnabled) return;
    var paper = this.paper, self = this;
    if(this.ft && this.ft.unplug) this.ft.unplug();
    this.ft = paper.freeTransformAdjusted(this.shapesSet, { keepRatio: false, scale : ['bboxCorners'], draw : ['bbox'], rotate : ['axisX'], drag : ['self']}, function(data,evetns){
        if(self.isPartOfGroup){
            return;
        }
        self.throttledCallback(data, evetns);
    }).hideHandles();

}

DecorativeShape.prototype.throttledCallback = _.throttle(function(data,events){
    var self = this;
    if(events.indexOf('drag start') > -1 || events.indexOf('rotate start') > -1 || events.indexOf('scale start') > -1){
        this.isDragging = true;
        self.dragStartCallback && self.dragStartCallback(self);
    }else if(events.indexOf('drag end') > -1 || events.indexOf('rotate end') > -1 || events.indexOf('scale end') > -1){
        this.changeCallback && this.changeCallback(this);
        self.dragEndCallback && self.dragEndCallback(self);
    }
}, 100, {trailing : true});


DecorativeShape.prototype.initFromObject = function(paper, shapeObject){
    this.shapesSet = this.paper.set();
    var shapeObject = this.shapeObject,
        defaultX = this.defaultX,
        defaultY = this.defaultY;

    if(!shapeObject){
        return;
    }else if(shapeObject.shapeType == 'circle'){
        this.shape = this.paper.circle(defaultX, defaultY, shapeObject.r).attr(shapeObject.attrs);
    }else if(shapeObject.shapeType === 'rect'){
        this.shape = this.paper.rect(defaultX, defaultY, shapeObject.w, shapeObject.h).attr(shapeObject.attrs);
    }else if(shapeObject.shapeType == 'roundedRect'){
        this.shape = this.paper.roundedRect(defaultX, defaultY, shapeObject.w, shapeObject.h, 5, 5, 0, 0).attr(shapeObject.attrs);
    }

    this.shape.data('seatId', this.id);
    this.shape.data('type','DecorativeShapeTheShape');

    this.shapesSet.push(this.shape);
    this.shapesSet.data('seatId', this.id);
    this.shapesSet.data('type','DecorativeShape');
}

DecorativeShape.prototype.initFromShapesArr = function(){
    var seatId;
    this.shapesSet = this.paper.set();
    var arr = this.shapesArr;
    for (var i = 0 ; i  <  arr.length; ++i){
        seatId = seatId || arr[i].data('seatId');
        this.shapesSet.push(arr[i]);
    }
    this.shape = this.shapesSet[0];
    this.id = seatId;
    this.shapesSet.data('seatId', seatId);
    this.shapesSet.data('type','DecorativeShape');
    this.normalState();
};

DecorativeShape.prototype.generateId = function ()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};



DecorativeShape.prototype.hideHandles = function(){
    this.handlesOn = false;
    this.ft.hideHandles();
}


DecorativeShape.prototype.removeFromPaper = function(){
    this.ft.unplug();
    this.shapesSet.remove();
}

DecorativeShape.prototype.generateShapesArr = function(){
    return [this.shape];
}

DecorativeShape.prototype.translate = function(x,y){
    this.ft.attrs.x = x;
    this.ft.attrs.y = y;
    this.ft.apply();
    this.ft.updateHandles();
};


DecorativeShape.prototype.normalState = function(){
    this.shape.attr(this.normalStateAttrs);
};

DecorativeShape.prototype.setBackgroundColor = function(color){
    this.shape.attr({fill : color});
};

DecorativeShape.prototype.getBBox = function(){
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
