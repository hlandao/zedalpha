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
                this.$getRecord(snap.name()).update(snap);
            },

            $setDate : function(date){
                this.date = date.clone();
            }
        });
    }).factory("EventsCollectionGenerator",function ($firebase, $log, EventsFactory) {
        return function (ref) {
            return $firebase(ref, {arrayFactory : EventsFactory}).$asArray();
        }
    }).service("EventsCollection", function (BusinessHolder, EventsCollectionGenerator, firebaseRef, $rootScope, $log, $filter, DateHolder, Event, $q) {
        var self = this,
            lastDate = null,
            lastBusiness = null;

        var subNameByDate = function(date){
            return date.dayOfYear();
            return date.format('YYYY-MM-DD');
        };

        this.sorted = {};

        this.updateEvents = function () {
            if (BusinessHolder.business) {
                var dayOfYear = DateHolder.currentDate.dayOfYear();

                if(dayOfYear == lastDate && lastBusiness == BusinessHolder.business){
                    return;
                }

                self.collection && self.collection.$destroy && self.collection.$destroy();

                lastDate = subNameByDate(DateHolder.currentDate);
                lastBusiness = BusinessHolder.business;

                var businessId = BusinessHolder.business.$id;
                var ref = firebaseRef('events/').child(businessId).child(dayOfYear);
                self.collection = EventsCollectionGenerator(ref, self);
                self.collection.$loaded().then(function(){
                    self.collection.$setDate(DateHolder.currentDate);
                    self.sortEvents();
                });
            }
        };


        this.sortEvents = function(statusFilter, query){
            if(self.collection && self.collection.length){
                var sorted = $filter('sortDayEvents')(self.collection, DateHolder.currentClock, statusFilter, query);
                angular.extend(self.sorted, sorted);
            }
        };

        this.maxEventDurationForEvent = function (event) {

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
            var maxDurationForEvent = self.maxEventDurationForEvent(tempEvent);
            if (maxDurationForEvent === 0) throw new TypeError("cannot create new event with the current startTime due to possible collisions");
            else if(maxDurationForEvent > 0) tempEvent.$setEndTimeWithDuration(maxDurationForEvent);
            return tempEvent;
        }


        /**
         * validates this for collisions
         * @returns {promise}
         */
        this.validateCollision = function (event) {
            if(!event.data.startTime.isSame(this.collection.date, 'day')){
                throw new TypeError('this.collection is not same day as event');
            }
            var defer = $q.defer();
            if (self.checkCollisionsForEvent(event)) {
                defer.reject({error: "ERROR_EVENT_MSG_COLLISION"});
            } else {
                defer.resolve();
            }
            return defer.promise;
        },

        //------- COLLISIONS & DURATIONS --------//
        /**
         * return TRUE if the @event collides with another event
         * @param event
         * @returns {boolean}
         */
        this.checkCollisionsForEvent = function(event){
            var eventToCheck, sharedSeats, isCollidingStatus;

            for (var key = 0; key < this.collection.length; ++key) {
                eventToCheck = this.collection.$getRecord(key);
                sharedSeats = checkIfTwoEventsShareTheSameSeats(event, eventToCheck);

                if(eventToCheck.$shouldCollide() && eventToCheck.$sharingTheSameSeatsWithAnotherEvent(event)){
                    if(eventToCheck.$maxDurationForEventInRegardToAnotherEvent(event) === 0){
                        return true;
                    }
                }


            }
            return false;
        };


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
            var promises = [self.checkGuestsPer15Minutes(), event.$checkIfEventFitsShifts()];

            return $q.all(promises).then(function (result) {
                for (var i = 0; i < result.length; ++i) {
                    if (result[i]) warnings.warnings.push(result[i]);
                }
                return warnings;
           });
        };

        this.beforeSave = function (event) {
            return self.validateCollision(event).
                then(angular.bind(event, event.$validatePhone)).
                then(angular.bind(event,event.$validateName)).
                then(angular.bind(event,event.$validateStartTime)).
                then(angular.bind(event,event.$validateEndTime)).
                then(angular.bind(event,event.$validateSeats)).
                then(angular.bind(event,event.$validateHostess)).
                then(angular.bind(self,self.checkAllWarnings, event));
        };

        this.saveWithValidation = function (event, approveAllWarnings) {
            return self.beforeSave(event).then(function (result) {
                if (!approveAllWarnings && (result.warnings && result.warnings.length)) {
                    return result;
                } else {
                    return self.saveAfterValidation(event);
                }
            });
        };


        this.saveAfterValidation = function (event) {
            if (event.$isNew()) {
                console.log('[EventsCollection] Adding event', event);
                return self.collection.$add(event.toObject()).then(function(){
                }).catch(function(){

                });
            } else {
                console.log('[EventsCollection] Saving event', event);
                return self.collection.$save(this).then(function(){

                }, function(){

                });
            }
        };


        $rootScope.$on('$businessHolderChanged', function(){
            updateEvents();
        });

        $rootScope.$on('$dateWasChanged', function(){
            console.log('$dateWasChanged');
            self.updateEvents();
        });

        $rootScope.$on('$clockWasChanged', function(){
            self.sortEvents();
        });
//        self.updateEvents();
    });



