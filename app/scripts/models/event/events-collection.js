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
    }).service("EventsCollection", function (BusinessHolder, EventsCollectionGenerator, firebaseRef, $rootScope, $log, $filter, DateHolder, Event, $q, StatusFilters, DateFormatFirebase,DateHelpers,$timeout,areYouSureModalFactory, CustomerIdFromPhone, CustomerGenerator, EventsNotificationsHolder, REMOVED_STATUS, ShiftsDayHolder) {

        var isJustChangedBaseDateForEvent;

        function EventsCollectionException(message) {
            this.name = 'EventsCollectionException';
            this.message= message;
        }
        EventsCollectionException.prototype = new Error();
        EventsCollectionException.prototype.constructor = EventsCollectionException;



        var self = this,
            lastSubName = null,
            lastBusinessId = null;

        this.sorted = {};
        this.filters = {
            status : null,
            query : null

        };


        var subNameByDate = function(date){
            return date.format('YYYY-MM-DD');
        };

        var  getCollectionForDate = function(businessId, _date, event){
            var subName;
            var date = DateHelpers.isMomentValid(_date) ? _date.clone() : null;

            if(date){
                subName = subNameByDate(date);
            }else if(event && event instanceof Event){
                subName = event.data.baseDate;
                if(event.myCollection && event.myCollection.subName == subName){
                    var defer = $q.defer;
                    defer.resolve(event.myCollection);
                    return defer.promise;
                }
            }else{
                throw new EventsCollectionException('getCollectionForDate was failed. Please provide a valid date or a valid event');
            }
            businessId = businessId || BusinessHolder.business.$id;


            if(subName == lastSubName && lastBusinessId == businessId){
                return $timeout(function(){
                    return self.collection;
                });
            }

            var ref = firebaseRef('events/').child(businessId).child(subName);
            var $EventCollection = EventsCollectionGenerator(ref);

            return $EventCollection.$loaded().then(function(collection){
                    collection.$setSubName(subName);
                return collection;
            }).catch(function(){
                throw new EventsCollectionException('Cannot get events with subName = ' + subName);
            });
        };


        var updateEvents = this.updateEvents = function () {
            if (BusinessHolder.business) {
                var newSubName = subNameByDate(DateHolder.currentDate);
                if(self.collection && newSubName == lastSubName && lastBusinessId == BusinessHolder.business.$id){
                    return;
                }




                return getCollectionForDate(BusinessHolder.business.$id, DateHolder.currentDate).then(function(collection){

                    lastSubName = newSubName;
                    lastBusinessId = BusinessHolder.business.$id;

                    self.collection && self.collection.$destroy && self.collection.$destroy();
                    self.latestEvent = null;
                    self.collection = null;

                    self.collection = collection;
                    self.collection.$watch(watchSelfCollection)
                    findLatestEvent();
                    sortEvents();
                    resetFilters();
                });
            }
        };


        /**
         * watcher for self.collection, invoked each time a change occurres in Firebase
         * @param watchDetails
         */
        var watchSelfCollection = function(watchDetails){
            if(!watchDetails) return;
            switch(watchDetails.event){
                case 'child_added':
                    if(isJustChangedBaseDateForEvent){
                        isJustChangedBaseDateForEvent = false;
                        var record = self.collection.$getRecord(watchDetails.key);
                        if(record){
                            var msg = $filter('translate')('EVENT_CHANGED') + '\n' + record.data.name + ' - ' + record.data.startTime.format('HH:mm');
                            EventsNotificationsHolder.alert.setMsg(msg);
                        }
                    }else{
                        var record = self.collection.$getRecord(watchDetails.key);
                        if(record){
                            var msg = $filter('translate')('EVENT_ADDED') + '\n' + record.data.name + ' - ' + record.data.startTime.format('HH:mm');
                            EventsNotificationsHolder.alert.setMsg(msg);
                        }
                    }
                    break;
                case 'child_moved':
                    break;
                case 'child_removed':
                    break;
                case 'child_changed':
                    var record = self.collection.$getRecord(watchDetails.key);
                    if(record){
                        var msg = $filter('translate')('EVENT_CHANGED') + '\n' + record.data.name + ' - ' + record.data.startTime.format('HH:mm');
                        EventsNotificationsHolder.alert.setMsg(msg);
                    }
                    break;
            }
            findLatestEvent();
            sortEvents();

        }


        /**
         * find the latest event(by start time) from self.collection
         */
        var findLatestEvent = function(){
            var currentEvent, key, output = null;
            if(self.collection && self.collection.length){
                for (var i = 0; i< self.collection.length; ++i) {
                    key = self.collection.$keyAt(i);
                    currentEvent = self.collection.$getRecord(key);
                    output = output ? (currentEvent.data.startTime.isAfter(output.data.startTime,'minutes') ? currentEvent : output) : currentEvent ;
                }
            }
           self.latestEvent = output;
        }

        var resetFilters = function(){
            self.filters.name = null;
            self.filters.status = StatusFilters[0];
        }

        var lastSortedStatusFilter, lastSortedQueryFilter, lastShiftName;
        var sortEvents = function(statusFilter, query){
            statusFilter = statusFilter || self.filters.status;
            query = query || self.filters.query;

            if(lastSortedStatusFilter == 'ENTIRE_SHIFT' && statusFilter == 'ENTIRE_SHIFT' && ShiftsDayHolder.selectedShift && ShiftsDayHolder.selectedShift.name == lastShiftName &&  lastSortedQueryFilter == query){
                return;
            }

            if(self.collection && self.collection.length){
                var sorted = $filter('sortDayEvents')(self.collection, DateHolder.currentClock, statusFilter, query);
                angular.extend(self.sorted, sorted);
                lastSortedStatusFilter = statusFilter;
                lastSortedQueryFilter = query;
                if(statusFilter == 'ENTIRE_SHIFT'){
                    lastShiftName = ShiftsDayHolder.selectedShift.name;
                }else{
                    lastShiftName = null;
                }
            }else{
                self.sorted.deadEvents = null;
                self.sorted.nowEvents = null;
                self.sorted.upcomingEvents = null;
            }

            $rootScope.$broadcast('$EventsCollectionUpdated');
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
            startTime = startTime || event.data.startTime;

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
            var tempEventDuration = tempEvent.$getDuration();

            return self.maxDurationForStartTime(null, null, tempEvent).then(function(maxDurationForEvent){
                if (maxDurationForEvent === 0) return $q.reject({error : 'ERROR_CREATE_NEW_EVENT'})
                else if(maxDurationForEvent > 0 && tempEventDuration > maxDurationForEvent) tempEvent.$setEndTimeWithDuration(maxDurationForEvent);
                return tempEvent;
            });
        };



        /**
         * validates this for collisions
         * @returns {promise}
         */
        this.validateCollision = function (event, extra) {
            return getCollectionForDate(null, null, event).then(function(collection){

                var extraSeats = extra && extra.seats ? extra.seats : event.data.seats,
                    extraStartTime = extra&&extra.startTime ? extra.startTime : event.data.startTime;
                return self.maxDurationForStartTime(extraStartTime, extraSeats, event).then(function(maxDurationForEvent){
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
//            if (!guestPer15Value || guestPer15Value === 0 || !eventGuestsPer15Value) return true;
            if(event && event.data && (!event.data.guests || event.data.guests == 0)){
                var defer = $q.defer();
                defer.resolve(true);
                return defer.promise;
            }
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
         * check all the available warnings for the event before save
         * @returns {Promise|*}
         */
        this.checkAllWarnings = function (event, seatingOptionsToValidate) {
            var warnings = {warnings: []};
            var promises = [self.checkGuestsPer15Minutes(event), event.$checkIfEventFitsShifts(), validateSeatingOptions(seatingOptionsToValidate, event)];

            return $q.all(promises).then(function (result) {
                for (var i = 0; i < result.length; ++i) {
                    if (result[i]) warnings.warnings.push(result[i]);
                }
                return warnings;
           });
        };

        this.beforeSave = function (event, seatingOptionsToValidate) {
            return self.validateCollision(event).
                then(angular.bind(event, event.$runAllSyncValidatorsWithPromise)).
                then(angular.bind(self,self.checkAllWarnings, event, seatingOptionsToValidate));
        };

        var validateSeatingOptions = function(seatingOptionsToValidate, event){
            var result = true;
            var defer = $q.defer();
            if(!seatingOptionsToValidate || event.data.isOccasional){
                defer.resolve();
                return defer.promise;
            }
            for(var i in seatingOptionsToValidate){
                if(!event.data.seatingOptions || !event.data.seatingOptions[i]){
                    result=false;
                    break;
                }
            }
            if(!result){
                list = _.map(seatingOptionsToValidate, function(item){
                    return item.option;
                });
                defer.resolve({warning : "WARNING_EVENT_SEATING_OPTIONS", extra : {list : list}});
            }else{
                defer.resolve();
            }

            return defer.promise;

        }


        this.saveWithValidation = function (event, approveAllWarnings, seatingOptionsToValidate) {
            return self.beforeSave(event, seatingOptionsToValidate).then(function (result) {
                if (!approveAllWarnings && (result && result.warnings && result.warnings.length)) {
                    return result;
                } else {

                    return self.saveAfterValidation(event);
                }
            });
        };


        this.saveAfterValidation = function (event) {
            return getCollectionForDate(null, null, event).then(function(collection){
                if(event.changedBaseDate){
                    return getCollectionForDate(BusinessHolder.business.$id, event.changedBaseDate).then(function(oldCollection){
                        var eventDataCloned = event.toObject();
                        isJustChangedBaseDateForEvent = true;
                        return collection.$add(eventDataCloned).then(function(snap){
                            sortEvents();
                            var addedEvent=collection.$getRecord(snap.name())
                            updateCustomerForEvent(addedEvent);
                            var oldEventRecord = oldCollection.$getRecord(event.$id);
                            return oldCollection.$remove(oldEventRecord).then(function(){
                                return true;
                            });
                        });

                    });

                }else{
                    if (event.$isNew()) {
                        return collection.$add(event.toObject()).then(function(snap){
                            sortEvents();
                            var addedEvent=self.collection.$getRecord(snap.name())
                            updateCustomerForEvent(addedEvent);
                        });
                    } else {
                        return collection.$save(event).then(function(){
                            sortEvents();
                            updateCustomerForEvent(event);
                        });

                    }
                }

            });

        };


        /**
         * Remove from collection
         * @param event
         * @returns {*}
         * @private
         */
        this.__remove = function(event){
            return getCollectionForDate(null, null, event).then(function(collection){
                collection.$remove(event).then(function(){
                    sortEvents();
                });

            });
        };


        /**
         * change status to 'REMOVED'
         * @param event
         * @returns {*}
         */
        this.remove = function(event){
            event.data.status = REMOVED_STATUS.status;
            return self.saveAfterValidation(event);
        };



        this.changeBaseDateForEvent = function(event, newBaseDateMoment){
            var oldBaseDateMoment = moment(event.data.baseDate, DateFormatFirebase);
            if(DateHelpers.isMomentSameDate(oldBaseDateMoment, newBaseDateMoment) ){
                var defer = $q.defer();
                defer.resolve();
                return defer.promise;
            }

            event.$changeBaseDate(newBaseDateMoment);


            return getCollectionForDate(BusinessHolder.business.$id, newBaseDateMoment).then(function(newCollection){
                var collision = newCollection.$checkCollisionsForEvent(event, null);
                if(collision){
                    event.$changeBaseDate(oldBaseDateMoment);
                    return $q.reject({error : 'ERROR_MSG_COLLISION', withEvent : collision});
                }else{
                    if(!event.changedBaseDate) event.changedBaseDate = oldBaseDateMoment;
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
                var savePromises = [self.saveWithValidation(e1, true), self.saveWithValidation(e2, true)];
                return $q.all(savePromises).then(function(){
                    $rootScope.$broadcast('$EventsCollectionUpdated');
                    return true;
                });
            }).catch(function(error){
                e1.data.seats = e1OriginalSeats;
                e2.data.seats = e2OriginalSeats;
                return $q.reject(error);
            });

        }


        this.resetEventsForBusiness = function(){
            var defer = $q.defer();
            areYouSureModalFactory(null, 'Are you sure you want to remove all the events from ' + BusinessHolder.business.name + ' ?').result.then(function(){
                var ref = firebaseRef('events/' + BusinessHolder.business.$id);
                ref.remove(function(){
                    $rootScope.$apply(function(){
                        defer.resolve();
                    });
                });
            }, defer.reject);
            return defer.promise;
        }

        // Customers
        var updateCustomerForEvent = function(event){
            if(!event || !event.$id || !event.data.phone) return;
            var customerId = CustomerIdFromPhone(event.data.phone);
            if(!customerId) return;
            CustomerGenerator(customerId).$loaded().then(function(customer){
                if(customer){
                    if(event.data.name) customer.name = event.data.name;
                    if(event.data.contactComment) customer.contactComment = event.data.contactComment;
                    customer.events = customer.events || {};
                    customer.events[event.$id] = true;
                }
                return customer.$save();
            });
        }


        // Watchers

        $rootScope.$on('$businessHolderChanged', function(){
            updateEvents();
        });

        $rootScope.$on('$dateWasChanged', function(){
            updateEvents();
        });

        $rootScope.$on('$clockWasChanged', function(){
            sortEvents();
        });

        $rootScope.$on('$requestSortEvents', function(){
            sortEvents();
        });

        $rootScope.$watch(function(){
            return self.filters.query;
        }, function(){
            sortEvents();
        });

        $rootScope.$watch(function(){
            return self.filters.status;
        }, function(){
            sortEvents();
        });


        $rootScope.$on('$firebaseSimpleLogin:logout', function(){
            lastSubName = null,
            lastBusinessId = null;

            self.collection = null;
            self.sorted = {};
            self.filters = {
                status : null,
                query : null
            };
        });
    });



