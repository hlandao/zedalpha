fabric.SeatShape = fabric.util.createClass(fabric.Group, {
    type: 'seatShape',
    initialize : function(objects, options){
        this.callSuper('initialize', objects, options);
        var text = this.theText();
        var shape = this.theShape();
        if(this.shouldCenterText){
            text.setLeft(0-(text.width/2));
            text.setTop(0-(text.height/2));
            this.shouldCenterText = false;
        }
        if(shape.type == 'triangle'){
            text.setTop(0);
        }


        this.set('seatNumber', options.seatNumber || '');
        if(!this.normalState)
            this.normalState = {
               top : shape.getTop(),
               left : shape.getLeft(),
               width : shape.getWidth(),
               radius : shape.radius,
               height : shape.getHeight(),
               stroke : shape.getStroke(),
               strokeWidth : shape.getStrokeWidth(),
               fill : shape.getFill()
            };


        this.on('scaling', function(){
            var text = this.theText();
            var shape = this.theShape();
            text.scaleX = this.scaleY/this.scaleX;

            if(shape.type =='circle'){
                shape.strokeWidth = (2) / this.scaleX;
            }else if(shape.type == 'rect'){
                shape.width = this.normalState.width * this.scaleX;
                shape.height = this.normalState.height * this.scaleY;
                shape.scaleX = 1 / this.scaleX ;
                shape.scaleY = 1 / this.scaleY ;

            }else if( shape.type == 'triangle'){
                var triScale = Math.max(this.scaleX, this.scaleY);
                shape.width = this.normalState.width * triScale;
                shape.height = this.normalState.height * triScale;
                shape.scaleX = 1 / triScale ;
                shape.scaleY = 1 / triScale ;
            }

//            shape.height *= this.scaleY;
//            shape.scaleX = 1;
//            shape.scaleY = 1;

        });

    },

    theShape : function(){
        return this._objects[0];
    },

    theText : function(){
        return this._objects[1];
    },


    setSeatNumber : function(seatNumber){
        var text = this._objects[1];
        text.setText(""+seatNumber);
        this.set('seatNumber', seatNumber);
    },

    selectNormal : function(){
        var shape = this.theShape();
        shape.setStroke("#bb62ff");
//        shape.setStrokeWidth(3);
    },

    setBackgroundColor : function(color){
        this.theShape().setFill(color);
    },
//    addButtons : function(){
//      var sharedButtonConfig = {
//        hasBorders : false,
//        hasControls : false,
//        lockRotation : true,
//        lockScalingX : true,
//        lockMovementX : true,
//        lockMovementY : true,
//        fontSize: 20,
//        backgroundColor : 'green'
//      };
//      var shape = this.theShape();
//      var shapeHeight = shape.getHeight();
//      var myTop = this.getTop();
//      var myLeft = this.getLeft();
//      var walkInButton  = new fabric.Text("Walk-In", $.extend(sharedButtonConfig,{}));
//      var destinationButton  = new fabric.Text("Destination", $.extend(sharedButtonConfig,{
//          top : -shape.height/2,
//          left : -shape.width/2
//      }));
////      this.add(walkInButton);
//      this.addWithUpdate(destinationButton);
//    },

//    getButtons : function(){
//        if(this._objects[2] &&this._objects[3])
//            return [this._objects[2],this._objects[3]];
//        else
//            return [];
//    },
//
//    removeButtons : function(){
//        var buttonsArr = this.getButtons();
//        for (var i = 0;i < buttonsArr.length; ++i){
//            this.remove(buttonsArr[i]);
//        }
//    },


    backToNormalState : function(){
        var shape = this.theShape();
        shape.setStroke(this.normalState.stroke);
//        shape.setStrokeWidth(this.normalState.stokeWidth);
        shape.setFill(this.normalState.fill);

    },

    setToStatic : function(){
      this.hasBorders = false;
      this.hasControls = false;
      this.lockRotation = true;
      this.lockScalingX = true;
      this.lockMovementX = true;
      this.lockMovementY = true;
    },


    toObject: function() {
        return fabric.util.object.extend(this.callSuper('toObject'), {
            seatNumber: this.get('seatNumber')
        });
    },


    transform : function(ctx, fromLeft){
        this.callSuper('transform', ctx, fromLeft);
        var text = this.theText();
        var shape = this.theShape();
        text.setAngle(-this.angle);
    }
});

/*
 * Synchronous loaded object
 */
fabric.SeatShape.fromObject = function (object, callback) {
    var _enlivenedObjects;
    fabric.util.enlivenObjects(object.objects, function (enlivenedObjects) {
        delete object.objects;
        _enlivenedObjects = enlivenedObjects;
    });
    return new fabric.SeatShape(_enlivenedObjects, object);
};


var seatRectFactory = function(seatNumber, seatConfig){
    var shapeDefault = {
        fill: '#fff',
        stroke: "#bbb",
        strokeWidth: 2,
        width: 50,
        height: 50
    };
    var textDefault = {
        fontSize: 18,
        fill: "#333",
        fontFamily: "Arial"
    };

    var groupDefault = {
        top: 100,
        left: 100,
        shouldCenterText : true
    };

    var text = new fabric.Text("" + seatNumber, $.extend(textDefault, seatConfig.textOptions));
    var rect = new fabric.Rect($.extend(shapeDefault, seatConfig.shapeOptions));

    return new fabric.SeatShape([ rect, text ], $.extend(groupDefault, seatConfig.groupOptions, {seatNumber : seatNumber}));
};

var seatCircleFactory = function(seatNumber, seatConfig){
    var shapeDefault = {
        fill: '#fff',
        stroke: "#bbb",
        strokeWidth: 2,
        radius : 25
    };
    var textDefault = {
        fontSize: 18,
        fill: "#333",
        fontFamily: "Arial"
    };

    var groupDefault = {
        top: 100,
        left: 100,
        shouldCenterText : true

    };

    var text = new fabric.Text("" + seatNumber, $.extend(textDefault, seatConfig.textOptions));
    var circle = new fabric.Circle($.extend(shapeDefault, seatConfig.shapeOptions));

    return new fabric.SeatShape([ circle, text ], $.extend(groupDefault, seatConfig.groupOptions, {seatNumber : seatNumber}));
};

var seatTriangleFactory = function(seatNumber, seatConfig){
    var shapeDefault = {
        fill: '#fff',
        stroke: "#bbb",
        strokeWidth: 2,
        width: 12,
        height: 12
    };
    var textDefault = {
        fontSize: 18,
        fill: "#333",
        fontFamily: "Arial"
    };

    var groupDefault = {
        top: 100,
        left: 100,
        shouldCenterText : true
    };

    var text = new fabric.Text("" + seatNumber, $.extend(textDefault, seatConfig.textOptions));
    var rect = new fabric.Triangle($.extend(shapeDefault, seatConfig.shapeOptions));

    return new fabric.SeatShape([ rect, text ], $.extend(groupDefault, seatConfig.groupOptions, {seatNumber : seatNumber}));
};


var blockFactory = function(seatConfig){
    var shapeDefault = {
        fill: '#333',
        strokeWidth: 0
    };
    var rect = new fabric.Rect($.extend(shapeDefault, seatConfig.shapeOptions));

    return rect;

};

var seatShapeFactory = function(seatNumber, seatConfig){
    if(seatConfig.shape === 'circle'){
        return seatCircleFactory(seatNumber, seatConfig);
    }else if(seatConfig.shape === 'rect'){
        return seatRectFactory(seatNumber, seatConfig);
    }else if(seatConfig.shape === 'triangle'){
        return seatTriangleFactory(seatNumber, seatConfig);
    }else if(seatConfig.shape === 'block'){
        return blockFactory(seatConfig);
    }
}


var LabeledRect = fabric.util.createClass(fabric.Rect, {

    type: 'labeledRect',

    initialize: function(options) {
        options || (options = { });

        this.callSuper('initialize', options);
        this.set('label', options.label || '');
    },

    toObject: function() {
        return fabric.util.object.extend(this.callSuper('toObject'), {
            label: this.get('label')
        });
    },

    _render: function(ctx) {
        this.callSuper('_render', ctx);

        ctx.font = '20px Helvetica';
        ctx.fillStyle = '#333';
        ctx.fillText(this.label, -this.width/2, -this.height/2 + 25);
    }
});
