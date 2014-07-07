var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives
    .directive('hlSeatsInput', ['$timeout','DateHelpers','FullDateFormat', function ($timeout,DateHelpers,FullDateFormat) {

        return {
            restrict: 'A',
            require:['ngModel'],
            link : function(scope, element, attrs, ctrls) {
                var ngModel = ctrls[0];

                ngModel.$formatters.push(function(modelValue){
                    var arr = _.map(modelValue, function(val, seatNumber){return seatNumber});
                    return arr.join(',');
                });


                ngModel.$render = function(){
                    element.val(ngModel.$viewValue);
                };


                element.on('blur keyup change', function() {
                    ngModel.$setViewValue(element.val());
                });

                ngModel.$parsers.push(function(viewValue){
                    viewValue = viewValue || "";
                    var output = {};
                    var arr = viewValue.split(',');
                    for(var i = 0; i <arr.length; ++i){
                        output[arr[i]] = true;
                    }

                    return output;
                });

            }
        };
    }])
    .filter('seats', function(){
       return function(input){
           if(!input) return;
           var arr = [];
           for(var i in input){
               if(input[i])
                    arr.push(i);
           }
           return arr.join(',');
       }
    });