var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('EventsHolder', function($rootScope,BusinessHolder, DateHolder){
        var $events = {today : null};
        var updateEvents = function(){
            if(BusinessHolder.$business && DateHolder.current){
                var dayOfYear = moment(DateHolder.current).dayOfYear();
                $events.today = BusinessHolder.$business.$child('events').$child(dayOfYear);
            }
        };

        $rootScope.$on('$businessHolderChanged', updateEvents);

        $rootScope.$watch(function(){
            return DateHolder.current;
        }, updateEvents);


        return $events;

    }).factory('EventsLogic', function(EventsHolder, BusinessHolder, EventsDurationForGuestsHolder, FullDateFormat){
        var DEFAULT_EVENT_DURATION = _.findWhere(EventsDurationForGuestsHolder, {guests : 'default'}).duration || 90;
        var checkCollisionsForEvent = function(event){
            for(var i in EventsHolder){

            }
            return false;
        };

        var isInValidateEventWhileEdit = function(event){
            if(checkCollisionsForEvent(event)){
                return "ERROR_EVENT_MSG_COLLISION";
            }
        };

        var isInValidateEventBeforeSave = function(event){

            // Event has no name
            if(!event.name){
                return "ERROR_EVENT_MSG_NAME";
            // Event has no seat or it is an occasional one and the business type is Bar
            } else if(isEventWithNoSeats(event) && (BusinessHolder.businessType != 'Bar' || !event.isOccasional)){
                return "ERROR_EVENT_MSG_SEATS";
            // Event has no phone and it isn't occasional
            }else if(!event.isOccasional && !event.phone){
                return "ERROR_EVENT_MSG_PHONE";
            // Event has no start time
            }else if(!event.startTime){
                return "ERROR_EVENT_MSG_STARTTIME";
            // Event has no end time
            }else if(!event.endTime){
                return "ERROR_EVENT_MSG_ENDTIME";
            }else if(checkCollisionsForEvent(event)){
                return "ERROR_EVENT_MSG_COLLISION";
            }
            return false;
        };

        var isEventWithNoSeats = function(event){
            return isEmptyObject(event.seats)
        }

        var endTimeForNewEventWithStartTime = function(startTime){
            console.log('DEFAULT_EVENT_DURATION',DEFAULT_EVENT_DURATION);
            return new Date(moment(startTime).add('minute', DEFAULT_EVENT_DURATION).format(FullDateFormat));
        };

        return {
            isInValidateEventBeforeSave : isInValidateEventBeforeSave,
            isInValidateEventWhileEdit : isInValidateEventWhileEdit,
            checkCollisionsForEvent : checkCollisionsForEvent,
            endTimeForNewEventWithStartTime : endTimeForNewEventWithStartTime
        }

    });