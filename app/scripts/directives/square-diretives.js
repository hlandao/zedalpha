var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives
    .directive('slimScroll', function(){
        return {
            restrict: 'A',
            link: function(scope, element, attrs){
                console.log('attrs.wheelStep',attrs.wheelStep);
                element.addClass('hl-slim-scroll').slimScroll({
                    height: attrs.scrollHeight || '100%',
                    wheelStep : attrs.wheelStep || 15,
                });
            }
        }
    }).directive('highlightActive', function($state){
        return function(scope, element, attrs){
            var $children = element.children();
            scope.$on('$stateChangeSuccess', function(event, newState){
                angular.forEach($children, function(child){
                    var $child = $(child);
                    var uiSref = $child.find('a').eq(0).attr('ui-sref');
                   var childStateName =  getStateNameFromHref(uiSref);
                    if(newState.name == childStateName) $child.addClass('active');
                    else $child.removeClass('active');
                });
            });

            var getStateNameFromHref = function(uiSref){
                if(!uiSref) return null;
                return uiSref.split('(')[0];
            }
        }
    });