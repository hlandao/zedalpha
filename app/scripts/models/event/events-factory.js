var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory("EventsFactory",function ($FirebaseArray, Event) {
        return $FirebaseArray.$extendFactory({
            $$added : function(snap){
                var newEvent = new Event(snap);
                this._process('child_added', newEvent);
            },
            // override the $$updated behavior to call a method on the Message
            $$updated: function (snap) {
                this.$getRecord(snap.name()).$update(snap);
            },

            $setSubName : function(subName){
                this.$list.subName = subName;
            },
            $setBusinessId : function(businessId){
                this.$list.businessId = businessId;
            },
            $checkCollisionsForEvent : function(event, extra){
                var eventToCheck,
                    extraSeats = extra && extra.seats ? extra.seats : null,
                    newStartTime = extra && extra.startTime ? extra.startTime : null,
                    newEndTime = extra && extra.endTime ? extra.endTime : null,
                    self = this;


                for (var i = 0; i < self.$list.length; ++i) {
                    eventToCheck = self.$list[i];
                    if(eventToCheck === event) continue;
                    if(eventToCheck.$shouldCollide() && eventToCheck.$sharingTheSameSeatsWithAnotherEvent(event, extraSeats)){
                        if(eventToCheck.$collideWithAnotherEvent(event, newStartTime, newEndTime)){
                            return eventToCheck;
                        }
                    }
                }
                return false;
            }

        });
    }).factory("EventsCollectionGenerator",function ($firebase, $log, EventsFactory) {
        return function (ref) {
            return $firebase(ref, {arrayFactory : EventsFactory}).$asArray();
        }
    });