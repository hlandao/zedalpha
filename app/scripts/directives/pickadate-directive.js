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
                    updatedByUser = false,
                    FORMAT_PICKADATE = 'dd/mm/yyyy',
                    FORMAT_MOMENT = 'DD/MM/YYYY';

                element.pickadate({
                    container : 'body',
                    onSet: function (context) {
                        if(updatedModel){
                            updatedModel = false;
                            updatedByUser = false;
                            return;
                        }

                        if(!context.select){
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
                    format : FORMAT_PICKADATE
                });

                var picker = element.pickadate('picker');

                var update = function(newVal){
                    var date = newVal.format(FORMAT_MOMENT);
                    updatedModel = true;
                    picker.set('select', date, { format: FORMAT_PICKADATE });
                };
                scope.$watch('pickADate', function(){
                    if(updatedByUser){
                        updatedModel = false;
                        updatedByUser = false;
                    }else{
                        update.apply(this,arguments);
                    }
                }, true);
            }
        };
    });