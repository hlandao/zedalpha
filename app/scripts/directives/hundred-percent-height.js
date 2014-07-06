var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives.
    directive('hundredPercentHeight', function(){
       return function(scope, element, attrs){

           var heightVal;
           var setElmHeight = function(){
               if(heightVal >= 0){
                   var docHeight = $(document).height();
                   element.height(docHeight-parseInt(val) + 'px');
               }
           }
           attrs.$observe('hundredPercentHeight', function(newVal){
               heightVal = newVal;
               setElmHeight();
           });

           window.on('resize', function(){
               setElmHeight();
           })
           scope.$on('$destory', function(){
               window.off('resize');
           });
       }
    });