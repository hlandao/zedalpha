var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);

var h = 1;
zedAlphaDirectives
    .directive('pickADate', function ($timeout, FullDateFormat) {
        return {
            restrict: "A",
            scope: {
                pickADate: '=',
                minDate: '=',
                maxDate: '='
            },
            link: function (scope, element, attrs) {
                var updatedModel = false;
                element.pickadate({
                    onSet: function (context) {
                        if(updatedModel){
                            updatedModel = false;
                            return;
                        }
                        $timeout(function(){
                            if (context.hasOwnProperty('clear')) {
                                scope.pickADate = null;
                                return;
                            }

                            var newDate = new Date(context.select);
                            scope.pickADate = moment(newDate);
                            attrs.onChange && scope.$parent.$eval(attrs.onChange);
                        },0);
                    },
                    onClose: function () {
                        element[0].blur();
                    },
                    format : 'dd/mm/yyyy'
                });

                var picker = element.pickadate('picker');

                var update = function(newVal){
                    var date = new Date(newVal.format(FullDateFormat));
                    picker.set('select', date);
                    updatedModel = true;
                };
                scope.$watch('pickADate', update);
            }
        };
    });