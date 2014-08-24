var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('CloseOpenControls', function($timeout, $rootScope){
        return function(){
          $rootScope.$broadcast('closeAllOpenControls');
        };
    });
