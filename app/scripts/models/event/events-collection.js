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
            $checkCollisionsForEvent : function(event, extra){
                var eventToCheck,
                    key,
                    extraSeats = extra ? extra.seats : null,
                    self = this;


                for (var i = 0; i < self.$list.length; ++i) {
                    eventToCheck = self.$list[i];
                    if(eventToCheck === event) continue;
                    if(eventToCheck.$shouldCollide() && eventToCheck.$sharingTheSameSeatsWithAnotherEvent(event, extraSeats)){
                        if(eventToCheck.$collideWithAnotherEvent(event)){
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
    }).service("EventsCollection", function (BusinessHolder, EventsCollectionGenerator, firebaseRef, $rootScope, $log, $filter, DateHolder, Event, $q, StatusFilters, DateFormatFirebase) {
        var self = this,
            lastSubName = null,
            lastBusinessId = null;

        this.sorted = {};
        this.filters = {};


        var subNameByDate = function(date){
            return date.format('YYYY-MM-DD');
        };

        var getCollectionForDate = function(businessId, date, event){
            var subName;
            if(date){
                subName = subNameByDate(date);
            }else if(event){
                subName = event.data.baseDate;
                if(event.myCollection && event.myCollection.subName == subName){
                    var defer = $q.defer;
                    defer.resolve(event.myCollection);
                    return defer.promise;
                }
            }
            businessId = businessId || BusinessHolder.business.$id;

            if(subName == lastSubName && lastBusinessId == businessId){
                var defer = $q.defer();
                defer.resolve(self.collection);
                return defer.promise;
            }

            console.log('Get collection for sub name', subName);
            var ref = firebaseRef('events/').child(businessId).child(subName);
            var $EventCollection = EventsCollectionGenerator(ref);

            console.log('Get collection for sub name', ref.toString());
            return $EventCollection.$loaded().then(function(collection){
                console.log('get collection done');
                collection.$setSubName(subName);
                return collection;
            });
        };


        var updateEvents = this.updateEvents = function () {
            console.log('updateEvents',BusinessHolder.business.$id);
            if (BusinessHolder.business) {
                var newSubName = subNameByDate(DateHolder.currentDate);
                if(newSubName == lastSubName && lastBusinessId == BusinessHolder.business.$id){
                    return;
                }

                self.collection && self.collection.$destroy && self.collection.$destroy();
                self.latestEvent = null;
                self.collection = null;


                return getCollectionForDate(BusinessHolder.business.$id, DateHolder.currentDate).then(function(collection){
                    console.log('getCollectionForDate result', collection);

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

            return getCollectionForDate(null, null, event).then(function(collection){
                var defer = $q.defer();
                var collision = collection.$checkCollisionsForEvent(event, extra);
                if (collision) {
                    defer.reject({error: "ERROR_EVENT_MSG_COLLISION", withEvent : collision});
                } else {
                    defer.resolve();
                }
                return defer.promise;
            });
        },

        //------- COLLISIONS & DURATIONS --------//
        /**
         * return TRUE if the @event collides with another event
         * @param event
         * @returns {boolean}
         */
        this.checkCollisionsForEvent = function(event, extra, collection){
            collection = collection || self.collection;
            return collection.$checkCollisionsForEvent(event,extra);
        };


        /**
         * checks the guests per 15 minutes limitation on the event
         * @returns {promise}
         */

        this.checkGuestsPer15Minutes = function (event) {
            console.log('event',event);
            var guestPer15Value = parseInt(BusinessHolder.business.guestsPer15);

            return self.isGuestsPer15ValidForNewEvent(event, guestPer15Value).then(function(result){
                if(result){
                    return null;
                }else{
                    return {warning: "INVALID_GUESTS_PER_15_WARNING"};
                }
            });

        };


        this.isGuestsPer15ValidForNewEvent = function (event, guestPer15Value) {
//            if (!guestPer15Value || guestPer15Value === 0 || !eventGuestsPer15Value) return true;
            return getCollectionForDate(null,null,event).then(function(collection){
                var count = guestPer15Value,
                    currentEvent,
                    key;

                for (var i = 0; i < collection.length; ++i) {
                    key = collection.$keyAt(i);
                    currentEvent = collection.$getRecord(key);
                    if (!currentEvent.data.isOccasional && event.data.startTime.isSame(currentEvent.data.startTime, 'minutes')) {
                        count += parseInt(currentEvent.guests);
                    }
                }
                return count <= guestPer15Value;
            });
        };




        /**
         * check all the available warnings for the event
         * @returns {Promise|*}
         */
        this.checkAllWarnings = function (event) {
            var warnings = {warnings: []};
            var promises = [self.checkGuestsPer15Minutes(event), event.$checkIfEventFitsShifts()];

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
                return getCollectionForDate(null, null, event).then(function(collection){
                    if(event.changedBaseDate){
                        var eventDataCloned = event.toObject();
                        return self.collection.$remove(event).then(function(){
                            return collection.$add(eventDataCloned).then(function(){
                                sortEvents();
                            });
                        });
                    }else{
                        return collection.$save(event).then(function(){
                            sortEvents();
                        });
                    }

                });
            }
        };

        this.remove = function(event){
            return getCollectionForDate(null, null, event).then(function(collection){
                collection.$remove(event).then(function(){
                    sortEvents();
                });

            });

        };


        this.changeBaseDateForEvent = function(event, newBaseDateMoment){
            var oldBaseDate = moment(event.data.baseDate);


            event.$changeBaseDate(newBaseDateMoment);


            return getCollectionForDate(BusinessHolder.business.$id, newBaseDateMoment).then(function(collection){
                var collision = collection.$checkCollisionsForEvent(event, null);
                if(collision){
                    event.$changeBaseDate(oldBaseDate);
                    return $q.reject({error : 'ERROR_MSG_COLLISION', withEvent : collision});
                }else{
                    event.myNewCollection = collection;
                    event.changedBaseDate = true;
                    return true;
                }
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



