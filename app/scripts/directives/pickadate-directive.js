var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);

var h = 1;
zedAlphaDirectives
    .directive('pickADate', function ($timeout) {
        return {
            restrict: "A",
            scope: {
                pickADate: '=',
                minDate: '=',
                maxDate: '='
            },
            link: function (scope, element, attrs) {

                element.pickadate({
                    onSet: function (e) {
                        var select = element.pickadate('picker').get('select'); // selected date
                        $timeout(function(){
                            if (e.hasOwnProperty('clear')) {
                                scope.pickADate = null;
                                return;
                            }

                            var newDate = new Date(0);
                            newDate.setYear(select.obj.getYear() + 1900); // hello Y2K...
                            // It took me half a day to figure out that javascript Date object's getYear
                            // function returns the years since 1900. Ironically setYear() accepts the actual year A.D.
                            // So as I got the $#%^ 114 and set it, guess what, I was transported to ancient Rome 114 A.D.
                            // That's it I'm done being a programmer, I'd rather go serve Emperor Trajan as a sex slave.
                            newDate.setMonth(select.obj.getMonth());
                            newDate.setDate(select.obj.getDate());
                            $scope.pickADate = moment(newDate);
                            attrs.onChange && scope.$parent.$eval(attrs.onChange);
                        },0,false);
                    },
                    onClose: function () {
                        element[0].blur();
                    },
                    format : 'dd/mm/yyyy'
                });

                var picker = element.pickadate('picker');

                var update = function(newVal){
                    var date = new Date(newVal);
                    picker.set('select', date);
                };
                scope.$watch('pickADate', update);
            }
        };
    });