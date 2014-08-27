var zedAlphaFilters = zedAlphaFilters || angular.module('zedalpha.filters', []);


zedAlphaFilters

    .filter('capitalize', function() {
    return function(input, scope) {
        if(!input) return '';
        input = input.toLowerCase();
        return input.substring(0,1).toUpperCase()+input.substring(1);
    }
}).filter('seats', function(){
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