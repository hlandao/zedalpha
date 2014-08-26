var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);

var h = 1;
zedAlphaDirectives
    .directive('shiftDuration', function ($timeout) {
        return {
            restrict: "A",
            scope: {
                shiftDuration: '='
            },
            link: function (scope, element, attrs) {
                var val,picker, initialized;

                scope.options = scope.options || {};

                element.pickatime({
                    onSet: function (e) {
                        var select = element.pickatime('picker').get('select'); // selected date
                        console.log('select',select);
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
                            console.log('select',select);
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
                    format: 'HH:i',
                    formatLabel: function(time) {
                        console.log('time',time);
                        var durationLabel = "";
                        if(scope.shiftDuration.startTime || scope.options.showDurations){
                            var clonedDate = scope.shiftDuration.startTime.clone().hour(time.hour).minute(time.mins),
                                diff = clonedDate.diff(scope.shiftDuration.startTime, 'minutes');

                            if(diff <= 0){
                                return  'HH:i';
                            }

                            var hours = Math.floor(diff/60),
                                minutes = Math.floor(diff - hours * 60);



                            if(hours <= 0 && minutes > 0){
                                durationLabel = " (" + minutes + " !m!ins)";
                            }else if(hours >= 0 && minutes <= 0){
                                durationLabel = " (" + hours + " !hours)";
                            }else if(hours >= 0 && minutes >= 0){
                                if(minutes < 10) minutes = "0" + minutes;
                                if(hours < 10) hours = "0" + hours;
                                durationLabel = " (" + hours + ":" + minutes + " !hours)";
                            }
                        }
                            return  'HH:i' + durationLabel;

                    }
                });

                picker = element.pickatime('picker');
                var setTime = function(){
                    var duration = scope.shiftDuration.duration,
                        referenceTime = scope.shiftDuration.startTime;

                    if(duration && referenceTime && referenceTime.isValid && referenceTime.isValid()){
                        var cloned = referenceTime.clone().add(duration, 'minutes');
                        val = [cloned.hour(), cloned.minute()];
                        picker.set('min', [scope.shiftDuration.startTime.hour(),scope.shiftDuration.startTime.minute()]);
                        picker.set('select',val);
                        picker.set('max', 10);



                    }
                };


                scope.$watch('shiftDuration.startTime + shiftDuration.duration', function(){
                    setTime();
                });

            }
        };
    });