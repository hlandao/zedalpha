var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory("EventsFactory",function ($FirebaseArray, Event) {
        return $FirebaseArray.$extendFactory({
            // override the $createObject behavior to return a Message object
            $createObject: function (snap) {
//                return new Event(snap);
            },

            // override the $$updated behavior to call a method on the Message
            $$updated: function (snap) {
                var i = this.$indexFor(snap.name());
                var event = this._list[i];
                event.$update(snap);
            }
        });
    }).factory("EventsCollectionGenerator",function ($firebase, $log, EventsFactory) {
        return function (ref) {
            return $firebase(ref, {arrayFactory : EventsFactory}).$asArray();
        }
    }).service("EventsCollection", function (BusinessHolder, EventsCollectionGenerator, firebaseRef, $rootScope, $log, $filter, DateHolder, Event, $q) {
        var self = this;

        this.updateEvents = function () {
            if (BusinessHolder.business) {
                var businessId = BusinessHolder.business.$id;
                var dayOfYear = DateHolder.currentDate.dayOfYear();
                var ref = firebaseRef('events/').child(businessId).child(dayOfYear);
                self.collection = EventsCollectionGenerator(ref, self);
                self.collection.$loaded().then(function(){
                    self.sortEvents();
                });
            }
        };


        this.sortEvents = function(statusFilter, query){
            if(self.collection && self.collection.length){
                var sorted = $filter('sortDayEvents')(self.collection, moment(), statusFilter, query);
                self.sorted = sorted;
            }
        };

        this.maxEventDurationForStartTime = function (event) {

            var maxDuration = -1, tempMaxDuration, currentEvent;
            for (var i = 0; i< this.collection.length; ++i) {
                currentEvent = this.collection.$getRecord(key);

                if (currentEvent.$shouldCollide() && currentEvent.$sharingTheSameSeatsWithAnotherEvent(event)) {
                    tempMaxDuration = currentEvent.$maxDurationForEventInRegardToAnotherEvent(event);
                    if (tempMaxDuration === 0) {
                        return 0;
                    } else if (tempMaxDuration > 0) {
                        maxDuration = (maxDuration == -1) ? tempMaxDuration : Math.min(tempMaxDuration, maxDuration);
                    }
                }
            }
            return maxDuration;
        };

        this.createNewEvent = function(data){
            // find the duration for the event and set the end time
            var tempEvent = new Event(null, data);
            var maxDurationForEvent = self.maxEventDurationForStartTime(tempEvent);
            if (maxDurationForEvent === 0) throw new TypeError("cannot create new event with the current startTime due to possible collisions");
            else if(maxDurationForEvent > 0) tempEvent.$setEndTimeWithDuration(maxDurationForEvent);
            return tempEvent;
        }


        /**
         * validates this for collisions
         * @returns {promise}
         */
        this.validateCollision = function (event) {
            var defer = $q.defer();
            if (self.checkCollisionsForEvent(event)) {
                defer.reject({error: "ERROR_EVENT_MSG_COLLISION"});
            } else {
                defer.resolve();
            }
            return defer.promise;
        },


        /**
         * checks the guests per 15 minutes limitation on the event
         * @returns {promise}
         */

        this.checkGuestsPer15Minutes = function (startTimeValue, guestPer15Value) {
            var defer = $q.defer();
            if (!this.isGuestsPer15ValidForNewEvent(startTimeValue, guestPer15Value)) {
                defer.resolve({warning: "INVALID_GUESTS_PER_15_WARNING"});
            } else {
                defer.resolve();
            }
            return defer.promise;
        };


        this.isGuestsPer15ValidForNewEvent = function (eventStartTime, eventGuestsPer15Value) {
            var guestPer15Value = parseInt(BusinessHolder.business.guestsPer15);
            if (!guestPer15Value || guestPer15Value === 0 || !eventGuestsPer15Value) return true;
            if (!eventStartTime) return true;
            var count = eventGuestsPer15Value, currentEvent;
            for (var key = 0; key < this.collection.length; ++key) {
                currentEvent = this.collection.$getRecord(key);
                if (!currentEvent.data.isOccasional && eventStartTime.isSame(currentEvent.data.startTime, 'minutes')) {
                    count += parseInt(currentEvent.guests);
                }
            }
            return count <= guestPer15Value;
        };




        /**
         * check all the available warnings for the event
         * @returns {Promise|*}
         */
        this.checkAllWarnings = function (event) {
            var warnings = {warnings: []};
            var promises = [this.$checkGuestsPer15Minutes(), event.$checkIfEventFitsShifts()];

            return $q.all(promises).then(function (result) {
                for (var i = 0; i < result.length; ++i) {
                    if (result[i]) warnings.warnings.push(result[i]);
                }
                return warnings;
           });
        };

        this.beforeSave = function (event) {
            return self.validateCollision().
                then(event.$validatePhone).
                then(event.$validateName).
                then(event.$validateStartTime).
                then(event.$validateEndTime).
                then(event.$validateSeats).
                then(event.$validateHostess).
                then(self.checkAllWarnings);
        };

        this.saveWithValidation = function (event, approveAllWarnings) {
            return self.beforeSave(event).then(function (result) {
                if (!approveAllWarnings && result.warnings) {
                    return result;
                } else {
                    self.saveAfterValidation(event);
                }
            });
        };


        this.saveAfterValidation = function (event) {
            if (event.$isNew()) {
                this.collection.$add(this.$event);
            } else {
                this.collection.$save(this);
            }
        };


        $rootScope.$on('$businessHolderChanged', function(){
            updateEvents();
        });

        $rootScope.$on('$dateWasChanged', function(){
            self.updateEvents();
        });

        $rootScope.$on('$clockWasChanged', self.sortEvents);
        self.updateEvents();
    });



