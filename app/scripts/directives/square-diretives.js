var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives
    .directive('slimScroll', function(){
        return {
            restrict: 'A',
            link: function(scope, element, attrs){
                element.slimScroll({
                    height: attrs.scrollHeight || '100%'
                });
            }
        }
    });