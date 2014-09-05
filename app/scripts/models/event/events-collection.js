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
            }
        });
    }).factory("EventsCollectionGenerator",function ($firebase, $log, EventsFactory) {
        return function (ref) {
            return $firebase(ref, {arrayFactory : EventsFactory}).$asArray();
        }
    }).service("EventsCollection", function (BusinessHolder, EventsCollectionGenerator, firebaseRef, $rootScope, $log, $filter, DateHolder, Event, $q, StatusFilters) {
        var self = this,
            lastSubName = null,
            lastBusinessId = null;

        this.sorted = {};
        this.filters = {};


        var subNameByDate = function(date){
            return date.format('YYYY-MM-DD');
        };

        var getCollectionForDate = function(businessId, date){
            var subName = subNameByDate(date);
            businessId = businessId || BusinessHolder.business.$id;

            if(subName == lastSubName && lastBusinessId == businessId){
                var defer = $q.defer();
                defer.resolve(self.collection);
                return defer.promise;
            }
            var ref = firebaseRef('events/').child(businessId).child(subName);
            return EventsCollectionGenerator(ref).$loaded().then(function(collection){
                console.log('collection',collection);
                collection.$setSubName(lastSubName);
                return collection;
            });
        };


        var updateEvents = function () {
            if (BusinessHolder.business) {
                var newSubName = subNameByDate(DateHolder.currentDate);
                if(newSubName == lastSubName && lastBusinessId == BusinessHolder.business.$id){
                    return;
                }

                self.collection && self.collection.$destroy && self.collection.$destroy();
                self.latestEvent = null;
                self.collection = null;

                getCollectionForDate(BusinessHolder.business.$id, DateHolder.currentDate).then(function(collection){
                    lastSubName = newSubName;
                    lastBusinessId = BusinessHolder.business.$id;

                    self.collection = collection;
                    findLatestEvent();
                    sortEvents();
                    resetFilters();
                });
            }
        };

        var findLatestEvent = function(){
            var currentEvent, key, output = null;
            if(self.collection && self.collection.length){
                for (var i = 0; i< self.collection.length; ++i) {
                    key = self.collection.$keyAt(i);
                    currentEvent = self.collection.$getRecord(key);
                    output = output ? (currentEvent.data.startTime.isAfter(output,'minutes') ? currentEvent : output) : currentEvent ;
                }
            }
           self.latestEvent = output;
        }

        var resetFilters = function(){
            self.filters.name = null;
            self.filters.status = StatusFilters[0];
        }

        var sortEvents = function(statusFilter, query){
            if(self.collection && self.collection.length){
                var sorted = $filter('sortDayEvents')(self.collection, DateHolder.currentClock, statusFilter, query);
                angular.extend(self.sorted, sorted);
            }else{
                self.sorted.deadEvents = null;
                self.sorted.nowEvents = null;
                self.sorted.upcomingEvents = null;
            }
        };


        this.maxEventDurationForEvent = function (event) {
            var maxDuration = -1, tempMaxDuration, currentEvent, key;
            for (var i = 0; i< this.collection.length; ++i) {
                key = this.collection.$keyAt(i);
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
        };



        /**
         * validates this for collisions
         * @returns {promise}
         */
        this.validateCollision = function (event, extra) {
//            var collection = event.$getCollection() || self.collection;
//            if(collection.subName != event.data.baseDate){
//
//            }
            var defer = $q.defer();
            if (self.collection.length && self.checkCollisionsForEvent(event, extra)) {
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
        this.checkCollisionsForEvent = function(event, extra){
            console.log('checkCollisionsForEvent');
            var eventToCheck, key;
            var extraSeats = extra ? extra.seats : null;

            for (var i = 0; i < self.collection.length; ++i) {
                key = self.collection.$keyAt(i);
                eventToCheck = self.collection.$getRecord(key);
                debugger;
                if(eventToCheck === event) continue;
                if(eventToCheck.$shouldCollide() && eventToCheck.$sharingTheSameSeatsWithAnotherEvent(event, extraSeats)){
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
            if (!self.isGuestsPer15ValidForNewEvent(startTimeValue, guestPer15Value)) {
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
            var count = eventGuestsPer15Value, currentEvent,key;
            for (var i = 0; i < self.collection.length; ++i) {
                key = self.collection.$keyAt(i);
                currentEvent = self.collection.$getRecord(key);
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
                return self.collection.$add(event.toObject()).then(function(){
                    sortEvents();
                }).catch(function(){

                });
            } else {
                return self.collection.$save(event).then(function(){
                    sortEvents();
                }, function(){

                });
            }
        };

        this.remove = function(event){
            return getCollectionForDate(null, event.data.startTime).then(function(collection){
                collection.$remove(event).then(function(){
                    sortEvents();
                });

            });

        };


        $rootScope.$on('$businessHolderChanged', function(){
            updateEvents();
        });

        $rootScope.$on('$dateWasChanged', function(){
            updateEvents();
        });

        $rootScope.$on('$clockWasChanged', function(){
            sortEvents();
        });
//        self.updateEvents();
    });



