var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('GuestsPer15', function($rootScope,BusinessHolder){
        var $guestsPer15;
        var updateValue = function(){
            if(BusinessHolder.$business){
                $guestsPer15 = BusinessHolder.$business.$child('guestsPer15');
            }
        };

        $rootScope.$on('$businessHolderChanged', updateValue);
        updateValue();


        return $guestsPer15;

    });