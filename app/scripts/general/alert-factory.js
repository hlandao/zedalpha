var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('Alert', function($timeout){
        function Alert(timeOnScreen){
            this.timeOnScreen = timeOnScreen;
            this.val = null;
        }

        Alert.prototype.setMsg = function(msg, timeOnScreen){
            var self = this;
            timeOnScreen = timeOnScreen || this.timeOnScreen;
            this.val = msg;
            if(this.timeoutPromise){
                $timeout.cancel(timeoutPromise);
            }
            $timeout(function(){
                self.val = null;
            },timeOnScreen);
        }

        return Alert;

    });
