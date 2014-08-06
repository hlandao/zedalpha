var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives
    .directive('a', function() {
        return {
            restrict: 'E',
            link: function(scope, elem, attrs) {
                if(attrs.ngClick || attrs.href === '' || attrs.href === '#'){
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
    });