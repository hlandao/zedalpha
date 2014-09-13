var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);

console.log('new version!');

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
    }).service("EventsCollection", function (BusinessHolder, EventsCollectionGenerator, firebaseRef, $rootScope, $log, $filter, DateHolder, Event, $q, StatusFilters, DateFormatFirebase,DateHelpers,$timeout) {
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

            console.log('ref = firebaseRef',businessId,subName);
            var ref = firebaseRef('events/').child(businessId).child(subName);
            var $EventCollection = EventsCollectionGenerator(ref);

            return $EventCollection.$loaded().then(function(collection){
                collection.$setSubName(subName);
                return collection;
            });
        };


        var updateEvents = this.updateEvents = function () {
            if (BusinessHolder.business) {
                var newSubName = subNameByDate(DateHolder.currentDate);
                if(newSubName == lastSubName && lastBusinessId == BusinessHolder.business.$id){
                    return;
                }

                self.collection && self.collection.$destroy && self.collection.$destroy();
                self.latestEvent = null;
                self.collection = null;


                return getCollectionForDate(BusinessHolder.business.$id, DateHolder.currentDate).then(function(collection){

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


//        this.maxDurationForEvent = function (event) {
//            var maxDuration = -1, tempMaxDuration, currentEvent, key;
//            for (var i = 0; i< this.collection.length; ++i) {
//                key = this.collection.$keyAt(i);
//                currentEvent = this.collection.$getRecord(key);
//                if (currentEvent.$shouldCollide() && currentEvent.$sharingTheSameSeatsWithAnotherEvent(event)) {
//                    tempMaxDuration = currentEvent.$maxDurationInRegardToAnotherEvent(event);
//
//                    if (tempMaxDuration === 0) {
//                        return 0;
//                    } else if (tempMaxDuration > 0) {
//                        maxDuration = (maxDuration == -1) ? tempMaxDuration : Math.min(tempMaxDuration, maxDuration);
//                    }
//                }
//            }
//            return maxDuration;
//        };

        this.maxDurationForStartTime = function (startTime, seats, event) {
            seats = seats || event.data.seats;
            startTime = startTime || event.startTime;
            return getCollectionForDate(null, null, event).then(function(collection){
                var maxDuration = -1, tempMaxDuration, currentEvent, key;

                for (var i = 0; i< collection.length; ++i) {
                    key = collection.$keyAt(i);
                    currentEvent = collection.$getRecord(key);
                    if (currentEvent !== event && currentEvent.$shouldCollide() && currentEvent.$sharingTheSameSeatsWithAnotherEvent(null, seats)) {
                        tempMaxDuration = currentEvent.$maxDurationInRegardToAnotherEvent(null, startTime);

                        if (tempMaxDuration === 0) {
                            return 0;
                        } else if (tempMaxDuration > 0) {
                            maxDuration = (maxDuration == -1) ? tempMaxDuration : Math.min(tempMaxDuration, maxDuration);
                        }
                    }
                }
                return maxDuration;

            });
        };



        this.createNewEvent = function(data){
            // find the duration for the event and set the end time
            var tempEvent = new Event(null, data);
            var maxDurationForEvent = self.maxDurationForStartTime(null, null, tempEvent);
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

                var extraSeats = extra && extra.seats ? extra.seats : event.data.seats,
                    extraStartTime = extra&&extra.startTime ? extra.startTime : event.data.startTime;
                self.maxDurationForStartTime(extraStartTime, extraSeats, event).then(function(maxDurationForEvent){
                    if(extra && extra.startTime && !extra.endTime){
                        var valueDurationBefore = event.$getDuration();
                        var newDuration = maxDurationForEvent >= 0 ? Math.min(maxDurationForEvent, valueDurationBefore) : valueDurationBefore;
                        extra.endTime = extra.startTime.clone().add(newDuration, 'minutes');
                    }


                    var collision = collection.$checkCollisionsForEvent(event, extra);
                    if (collision) {
                        return $q.reject({error: "ERROR_EVENT_MSG_COLLISION", withEvent : collision});
                    } else {
                       return true;
                    }


                });

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
            console.log('guestPer15Value',guestPer15Value);
//            if (!guestPer15Value || guestPer15Value === 0 || !eventGuestsPer15Value) return true;
            return getCollectionForDate(null,null,event).then(function(collection){
                var count = parseInt(event.data.guests),
                    currentEvent,
                    key;

                for (var i = 0; i < collection.length; ++i) {
                    key = collection.$keyAt(i);
                    currentEvent = collection.$getRecord(key);
                    if (currentEvent !== event && !currentEvent.data.isOccasional && event.data.startTime.isSame(currentEvent.data.startTime, 'minutes')) {
                        count += parseInt(currentEvent.data.guests);
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
                then(angular.bind(event, event.$runAllSyncValidatorsWithPromise)).
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
            var oldBaseDate = moment(event.data.baseDate, DateFormatFirebase);
            if(DateHelpers.isMomentSameDate(oldBaseDate), newBaseDateMoment ){
                var defer = $q.defer();
                defer.resolve();
                return defer.promise;
            }

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

        this.switchEventsSeatsWithValidation = function(e1, e2){
            var e1OriginalSeats = angular.copy(e1.data.seats),
                e2OriginalSeats = angular.copy(e2.data.seats),
                checkPromises = [];

            e1.data.seats = e2OriginalSeats;
            e2.data.seats = e1OriginalSeats;

            checkPromises.push(self.validateCollision(e1));
            checkPromises.push(self.validateCollision(e2));

            return $q.all(checkPromises).then(function(){
                var savePromises = [self.saveWithValidation(e1, true), self.saveWithValidation(e1, true)];
                return $q.all(savePromises);
            }, function(){
                e1.data.seats = e1OriginalSeats;
                e2.data.seats = e2OriginalSeats;
            });

        }


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



