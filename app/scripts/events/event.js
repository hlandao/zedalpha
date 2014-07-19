var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('Event', function(){

        var isInvalidEventWhileEdit = function(event){
            if(EventsLogic.checkCollisionsForEvent(event)){
                return {error : "ERROR_EVENT_MSG_COLLISION"};
            }
            return false;
        };



        function Event(data){
            this.isInvalidEventWhileEdit = isInvalidEventWhileEdit;
        }

        return Event;
    });