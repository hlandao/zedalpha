var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives
    .directive('a', function() {
        return {
            restrict: 'E',
            link: function(scope, elem, attrs) {
                if(attrs.ngClick){
                    elem.on('click', function(e){
                        e.preventDefault();
                    });
                }
            }
        };
    }).directive('closeDropdowns', function(){
        return function(scope, elem, attrs){
            elem.click(function(){
                $('.dropdown').removeClass('open');
            });
            scope.$on('$destroy', function(){
                elem.off('click');
            })
        }
    }).directive('stopPropagation', function(){
        return function(scope, element, attrs){

            element.click(function(e){
                e.stopPropagation();
                e.preventDefault();
            })

            scope.$on('$destroy', function(){
                element.off('click');
            });
        }
    });
