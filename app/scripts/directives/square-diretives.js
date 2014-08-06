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
    }).directive('collapseNav', [
        function() {
            return {
                restrict: 'A',
                link: function(scope, ele, attrs) {
                    var $a, $aRest, $lists, $listsRest, app;
                    $lists = ele.find('ul').parent('li');
                    $lists.append('<i class="fa fa-caret-right icon-has-ul"></i>');
                    $a = $lists.children('a');
                    $listsRest = ele.children('li').not($lists);
                    $aRest = $listsRest.children('a');
                    app = $('#app');
                    $a.on('click', function(event) {
                        var $parent, $this;
                        if (app.hasClass('nav-min')) {
                            return false;
                        }
                        $this = $(this);
                        $parent = $this.parent('li');
                        $lists.not($parent).removeClass('open').find('ul').slideUp();
                        $parent.toggleClass('open').find('ul').slideToggle();
                        return event.preventDefault();
                    });
                    $aRest.on('click', function(event) {
                        return $lists.removeClass('open').find('ul').slideUp();
                    });
                    return scope.$on('minNav:enabled', function(event) {
                        return $lists.removeClass('open').find('ul').slideUp();
                    });
                }
            };
        }
    ]).directive('toggleOffCanvas', [
        function() {
            return {
                restrict: 'A',
                link: function(scope, ele, attrs) {
                    return ele.on('click', function() {
                        return $('body').toggleClass('on-canvas');
                    });
                }
            };
        }
    ]);