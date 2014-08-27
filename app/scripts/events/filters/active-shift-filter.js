var zedAlphaFilters = zedAlphaFilters || angular.module('zedalpha.filters', []);


zedAlphaFilters

    .filter('activeShift', function(){
        return function(shiftsArr){
            if(!shiftsArr) return null;
            var tempShift, output = [];
            for(var i in shiftsArr){
                tempShift = shiftsArr[i];
                if(tempShift.active){
                    output.push(tempShift);
                }
            }
            return output;
        }
    });