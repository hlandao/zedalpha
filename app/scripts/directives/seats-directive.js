var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives

    .directive('hlSeatsInput', ['$timeout', function ($timeout) {

        return {
            restrict: 'A',
            require:['?^ngModel'],

            link : function(scope, element, attrs, ctrls) {
                var ngModel = ctrls[0];

                if ( ngModel ) {
                    ngModel.$render=function(){
                        if(!ngModel.$viewValue) return;
                        var viewValue = ngModel.$viewValue||{};
                        var arr = _.map(viewValue, function(val, seatNumber){return seatNumber});

                        element.val(arr.join(','));
                    };
                    // Listen for change events to enable binding
                    element.on('blur keyup change', function() {
                        scope.$apply(read);
                    });
                    read(); // initialize

                    // Write data to the model
                    function read() {
                        var val = element.val();
                        if(!val) return;
                        ngModel.$setViewValue(val);
                    }


                }


            }
        };
    }]);