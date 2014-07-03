var sharedCanvasResources = {
    createTheCanvas : function(){
        return new fabric.Canvas('canvas', {width:2000, height:2000});
    },

    listenToContainerScrollWithCanvas : function(canvas){
        fabric.util.addListener(document.getElementById('map-container'), 'scroll', function () {
            canvas.calcOffset();
        });
    },

    addBGToCanvas : function(canvas){
        var bgImage = new fabric.Rect({
            width:2000,
            height:2000,
            top:0,
            left:0,
            fill : 'red',
            selectable: false,
            hasBorders : false,
            hasControls : false,
            hoverCursor : 'pointer',
            lockRotation : true,
            lockScalingX : true,
            lockScalingY : true,
            lockMovementX : true,
            lockMovementY : true,
            hasRotatingPoint : false,
            bgImage : 'bgImage'

        });

        fabric.util.loadImage('../images/graphy.png', function(img) {
            bgImage.setPatternFill({
                source: img,
                repeat: 'repeat'
            });
            canvas.add(bgImage);
            canvas.sendToBack(bgImage);
            canvas.renderAll();
        });
        return bgImage;
    },

    removeBgIfAlreadyAdded : function(canvas){
    for (var i =0; i<canvas._objects.length; ++i){
        if(canvas._objects[i].bgImage == 'bgImage'){
            canvas._objects.splice(i,1);
            return;
        }
    }
    return;
}
}