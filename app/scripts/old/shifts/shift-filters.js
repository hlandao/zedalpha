var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives
    .filter('weekRangeByWeekNumber', function(){
        return function(weekNumber){
            var date = moment().week(weekNumber);
            return date.day(0).format('DD/MM/YYYY') + " - " + date.day(6).format('DD/MM/YYYY');
        }
    });