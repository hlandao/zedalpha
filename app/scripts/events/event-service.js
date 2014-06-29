var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('Event', function(){
        function Event(data){
            angular.extend(this, data);
            return this;
        }

        return Event;
    });