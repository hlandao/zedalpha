var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);

zedAlphaServices.factory('Shifts', function(BusinessHolder){
    var shiftsWithDayOfYear = function(dayOfYear){
        return BusinessHolder.business.$child('shifts').$child('days').$child(dayOfYear);
    }

    var basicShifts = function(dayOfWeek){
        return BusinessHolder.business.$child('shifts').$child('basic').$child(dayOfWeek);
    }

   return {
       $shift : function(){
           return $shift;
       },
       shiftsWithDayOfYear : shiftsWithDayOfYear,
       basicShifts : basicShifts
   }
});

