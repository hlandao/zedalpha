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
                var updatedModel = false,
                    updatedByUser = false;
                element.pickadate({
                    onSet: function (context) {
                        if(updatedModel){
                            updatedModel = false;
                            updatedByUser = false;
                            return;
                        }
                        $timeout(function(){
                            var newDate = new Date(context.select),
                                newMoment = moment(newDate);
                            updatedByUser = true;
                            scope.pickADate.date(newMoment.date()).month(newMoment.month()).year(newMoment.year());
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
                    updatedModel = true;
                    picker.set('select', date);
                };
                scope.$watch('pickADate', function(){
                    if(updatedByUser){
                        updatedModel = false;
                        updatedByUser = false;
                    }else{
                        update.apply(this,arguments);
                    }
                });
            }
        };
    });