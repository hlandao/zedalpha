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
                            if (!scope.pickADate)
                                scope.pickADate = new Date(0);
                            scope.pickADate.setYear(select.obj.getYear() + 1900); // hello Y2K...
                            // It took me half a day to figure out that javascript Date object's getYear
                            // function returns the years since 1900. Ironically setYear() accepts the actual year A.D.
                            // So as I got the $#%^ 114 and set it, guess what, I was transported to ancient Rome 114 A.D.
                            // That's it I'm done being a programmer, I'd rather go serve Emperor Trajan as a sex slave.
                            scope.pickADate.setMonth(select.obj.getMonth());
                            scope.pickADate.setDate(select.obj.getDate());

                        },0,false);
                    },
                    onClose: function () {
                        element[0].blur();
                    },
                    formatLabel : 'HH:i'
                });
            }
        };
    })
    .directive('pickATime', function ($timeout) {
        return {
            restrict: "A",
            scope: {
                pickATime: '=',
                min: '=',
                max: '='
            },
            link: function (scope, element, attrs) {
                var val,picker, initialized;


                element.pickatime({
                    onSet: function (e) {
                        var select = element.pickatime('picker').get('select'); // selected date
                        $timeout(function () {
                            if (e.hasOwnProperty('clear')) {
                                scope.pickATime = null;
                                return;
                            }
                            if (!scope.pickATime || !scope.pickATime.isValid)
                                scope.pickATime = new moment();
                            // (attrs.setUtc)
                            // ? scope.pickATime.setUTCHours(select.hour)
                            // : scope.pickATime.setHours(select.hour);
                            scope.pickATime.hour(select.hour);
                            scope.pickATime.minute(select.mins);
                            scope.pickATime.seconds(0);
                            scope.pickATime.milliseconds(0);
                            if(!initialized){
                                initialized = true;
                                return;
                            }else{
                                scope.$parent.$eval(attrs.onChange);
                            }
                        },0, false);
                    },
                    onClose: function () {
                        element[0].blur();
                    },
                    format : 'HH:i'
                });

                picker = element.pickatime('picker');
                var setTime = function(){
                    if(scope.pickATime && scope.pickATime.isValid && scope.pickATime.isValid()){
                        val = [scope.pickATime.hour(), scope.pickATime.minute()];
                        picker.set('select',val);
                    }
                };


                scope.$watch('pickATime', function(){
                    setTime();
                });

            }
        };
    });