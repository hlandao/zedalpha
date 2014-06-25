var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);

var SeatShape = fabric.util.createClass(fabric.Group, {
    type: 'seat',
    initialize : function(options){
        this.callSuper('initialize', options);
        var text = this._objects[1];
        text.centeredRotation = true;
        text.centeredScaling = true;
        text.setLeft(0-(text.width/2));
        text.setTop(0-(text.height/2));
        this.set('seatNumber', options.seatNumber || '');

    },

    setSeatNumber : function(seatNumber){
        var text = this._objects[1];
        text.setText(""+text);
        this.set('seatNumber', seatNumber);
    },


    toObject: function() {
        return fabric.util.object.extend(this.callSuper('toObject'), {
            seatNumber: this.get('seatNumber')
        });
    },

    transform : function(ctx, fromLeft){
        this.callSuper('transform', ctx, fromLeft);
        var text = this._objects[1];
        text.setAngle(-this.angle);
    }
});

var seatRectFactory = function(seatNumber, seatConfig){
    var shapeDefault = {
        fill: '#777',
        stroke: "black",
        strokeWidth: 3,
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

    return new SeatShape([ rect, text ], $.extend(groupDefault, seatConfig.groupOptions, {seatNumber : seatNumber}));
};

var seatCircleFactory = function(seatNumber, seatConfig){
    var shapeDefault = {
        fill: '#777',
        stroke: "black",
        strokeWidth: 3,
        radius : 50
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

    return new SeatShape([ circle, text ], $.extend(groupDefault, seatConfig.groupOptions, {seatNumber : seatNumber}));
};


var seatShapeFactory = function(seatNumber, seatConfig){
    if(seatConfig.shape === 'circle'){
        return seatCircleFactory(seatNumber, seatConfig);
    }else{
        return seatRectFactory(seatNumber, seatConfig);
    }
}




zedAlphaDirectives
    .directive('map', function() {
        return {
            restrict: 'E',
            templateUrl : 'partials/map/map.html',
            link: function(scope, elem, attrs) {

                scope.seatConfigs = {
                    'Chair' : {
                        drawingDefaults : {
                            shape : 'circle',
                            circleOptions : {radius : 50},
                            textOptions : {fontSize: 25},
                            groupOptions : {}
                        }
                    },
                    'Table' :  {
                        drawingDefaults : {
                            shape : 'rect'
                        }
                    }
                };


                var canvas = new fabric.Canvas('canvas', {
                    backgroundColor: 'rgb(230,230,230)'
                });


                scope.addSeat = function(newSeat){
                    if(!newSeat.seatNumber && newSeat.seatNumber !== 0){
                        scope.err = "Please enter seat number";
                    }else if(!newSeat.seatConfig){
                        scope.err = "Please select seat type";
                    }
                    var shape = seatShapeFactory(newSeat.seatNumber, newSeat.seatConfig.drawingDefaults);
                    canvas.add(shape);
                    newSeat = {seatNumber : ++newSeat.seatNumber};
                }
            }
        };
    });

