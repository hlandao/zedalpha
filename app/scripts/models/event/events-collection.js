var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory("EventsFactory",function ($FirebaseArray, Event) {
        return $FirebaseArray.$extendFactory({
            // override the $createObject behavior to return a Message object
            $createObject: function (snap) {
                return new Event(snap);
            },

            // override the $$updated behavior to call a method on the Message
            $$updated: function (snap) {
                var i = this.$indexFor(snap.name());
                var event = this._list[i];
                event.$update(snap);
            }
        });
    }).factory("EventsCollection",function ($firebase, EventsFactory, $log) {
        return function (ref, date) {
            if(date){
                var dayOfYear = moment(date).dayOfYear();
                ref = ref.child(dayOfYear);
            }
            console.log('ref',ref);
            return $firebase(ref, {arrayFactory: EventsFactory}).$asArray();
        }
    }).service("EventsHolder", function (BusinessHolder, EventsCollection, firebaseRef, DateHolder, $rootScope, $log, $filter) {
        var self = this;

        var updateEvents = function () {
            if (BusinessHolder.business) {
                var businessId = BusinessHolder.business.$id;
                var ref = firebaseRef('events/' + businessId);
                self.collection = EventsCollection(ref, DateHolder.currentDate).$loaded().then(function (col) {
                    console.log('collection',col)
                    $log.info('[EventsHolder] Loaded ' + self.collection.length + ' events for business id : ' + businessId);
                    sortEvents();
                }, function(){
                    $log.error('[EventsHolder] Failed loaded events for business id : ' + businessId);
                });
            }
        };


        var sortEvents = this.sortEvents = function(statusFilter, query){
            var sorted = $filter('sortDayEvents')(self.collection, DateHolder.currentClock, statusFilter, query);
            self.sorted = sorted;
        };

        this.maxEventDurationForStartTime = function (event) {
            var maxDuration = -1, tempMaxDuration, currentEvent;
            for (var i = 0; i< this.collection.length; ++i) {
                currentEvent = this.collection.$getRecord(key);

                if (currentEvent.$shouldCollide() && event.$sharingTheSameSeatsWithAnotherEvent(currentEvent)) {
                    tempMaxDuration = event.$maxDurationForEventInRegardToAnotherEvent(currentEvent);
                    if (tempMaxDuration === 0) {
                        return 0;
                    } else if (tempMaxDuration > 0) {
                        maxDuration = (maxDuration == -1) ? tempMaxDuration : Math.min(tempMaxDuration, maxDuration);
                    }
                }
            }
            return maxDuration;
        };

        this.isGuestsPer15ValidForNewEvent = function (newEvent) {
            var guestPer15Value = parseInt(GuestsPer15.$value);
            if (!guestPer15Value || guestPer15Value === 0 || !this.data.guests) return true;
            if (!newEvent.data.startTime) return false;
            var count = 0, currentEvent;
            for (var key in this.collection) {
                currentEvent = this.collection.$getRecord(key);
                if (!currentEvent.isOccasional && newEvent.data.startTime.isSame(currentEvent.data.startTime, 'minutes')) {
                    count += parseInt(currentEvent.guests);
                }
            }

            return count <= guestPer15Value;
        };

        $rootScope.$on('$businessHolderChanged', updateEvents);
        $rootScope.$on('$dateWasChanged', updateEvents);
        $rootScope.$on('$clockWasChanged', sortEvents);
        updateEvents();
    });



