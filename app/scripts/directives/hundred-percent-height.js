var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives.
    directive('hundredPercentHeight', function(){
       return function(scope, element, attrs){
           attrs.$observe('hundredPercentHeight', function(val){
              var docHeight = $(document).height();
              element.height(docHeight-parseInt(val) + 'px');
           });
       }
    });