fabric.SeatShape = fabric.util.createClass(fabric.Group, {
    type: 'seatShape',
    initialize : function(objects, options){

        this.callSuper('initialize', objects, options);
        var text = this.theText();
        var shape = this.theShape();
        text.centeredRotation = true;
        text.centeredScaling = true;
        text.setLeft(0-(text.width/2));
        text.setTop(0-(text.height/2));
        this.set('seatNumber', options.seatNumber || '');
        this.set('normalState', {
           top : shape.getTop(),
           left : shape.getLeft(),
           width : shape.getWidth(),
           height : shape.getHeight(),
           stroke : shape.getStroke(),
           strokeWidth : shape.getStrokeWidth(),
           fill : shape.getFill()
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
        shape.setStroke("#CD5C5C");
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
        shape.setStrokeWidth(this.normalState.stokeWidth);
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
        fill: '#777',
        stroke: "black",
        strokeWidth: 2,
        width: 50,
        height: 50
    };
    var textDefault = {
        fontSize: 25,
        fill: "white"
    };

    var groupDefault = {
        top: 100,
        left: 100
    };

    var text = new fabric.Text("" + seatNumber, $.extend(textDefault, seatConfig.textOptions));
    var rect = new fabric.Rect($.extend(shapeDefault, seatConfig.shapeOptions));

    return new fabric.SeatShape([ rect, text ], $.extend(groupDefault, seatConfig.groupOptions, {seatNumber : seatNumber}));
};

var seatCircleFactory = function(seatNumber, seatConfig){
    var shapeDefault = {
        fill: '#777',
        stroke: "black",
        strokeWidth: 2,
        radius : 25
    };
    var textDefault = {
        fontSize: 25,
        fill: "white"
    };

    var groupDefault = {
        top: 100,
        left: 100
    };

    var text = new fabric.Text("" + seatNumber, $.extend(textDefault, seatConfig.textOptions));
    var circle = new fabric.Circle($.extend(shapeDefault, seatConfig.shapeOptions));

    return new fabric.SeatShape([ circle, text ], $.extend(groupDefault, seatConfig.groupOptions, {seatNumber : seatNumber}));
};


var seatShapeFactory = function(seatNumber, seatConfig){
    if(seatConfig.shape === 'circle'){
        return seatCircleFactory(seatNumber, seatConfig);
    }else{
        return seatRectFactory(seatNumber, seatConfig);
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
