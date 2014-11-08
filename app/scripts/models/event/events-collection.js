var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
   .service("EventsCollection", function (BusinessHolder, EventsCollectionGenerator, firebaseRef, $rootScope, $log, $filter, DateHolder, Event, $q, StatusFilters, DateFormatFirebase,DateHelpers,$timeout,areYouSureModalFactory, CustomerIdFromPhone, CustomerGenerator, EventsNotificationsHolder, REMOVED_STATUS, ShiftsDayHolder, DateFormatFirebase) {


        function EventsCollectionException(message) {
            this.name = 'EventsCollectionException';
            this.message= message;
        }
        EventsCollectionException.prototype = new Error();
        EventsCollectionException.prototype.constructor = EventsCollectionException;




        var self = this;


        this.sorted = {};
        this.recentFilters = {};

        /**
         * Return events collection subname by date
         * @param date
         * @returns a string in the DateFormatFirebase format
         */
        var subNameByDate = function(date){
            if(!DateHelpers.isMomentValid(date)){
                throw new EventsCollectionException('subNameByDate requires a valid Moment object as (date)');
            }
            return date.format(DateFormatFirebase);
        };


        /**
         * Fetch events collection for a certain date
         * @param businessId
         * @param date
         * @param event
         * @returns {*}
         */
        var  fetchCollectionForDate = function(businessId, date, event){
            if(!businessId){
                throw new EventsCollectionException('fetchCollectionForDate requires a (businessId). businessID : ' + businessId + '. date :' + date + '. event : ' + event);
            }

            if((!date || !DateHelpers.isMomentValid(date)) && (!event || !event instanceof Event)){
                throw new EventsCollectionException('fetchCollectionForDate requires either a valid Moment object as (date) or a Event object as (event). businessID : ' + businessId + '. date :' + date + '. event : ' + event);
            }

            date = DateHelpers.isMomentValid(date) ? date.clone() : DateHelpers.getRealDateWithOverlapingDays(event.data.startTime);
            var subName = subNameByDate(date);

            if(isSameAsSelfCollection(businessId, subName)){
                return $timeout(function(){
                    return self.collection;
                });
            }

            $log.debug('[EventsCollection] fetching colleciton for businessId : ' + businessId + ' and date : ' + subName);
            var ref = firebaseRef('events/').child(businessId).child(subName);
            var $EventCollection = EventsCollectionGenerator(ref);

            return $EventCollection.$loaded().then(function(collection){
                collection.$setSubName(subName);
                collection.$setBusinessId(businessId);

                return collection;
            }).catch(function(error){
                throw new EventsCollectionException('Cannot get events with subName : %s. Error : %s', subName, error);
            });
        };


        /**
         * Load events to self.collections(usually when changing date)
         * @param businessId
         * @param date
         * @param clock
         */
        var loadEventsForDate = this.loadEventsForDate = function (businessId, date, clock) {
            businessId = businessId || BusinessHolder.business.$id;
            if(!DateHelpers.isMomentValid(date)){
                throw new EventsCollectionException('Cannot load current events without a Moment object (date)');
            }

            $log.debug('[EventsCollection] load events  for businessId : ' + businessId + ' and date : ' + date);

            fetchCollectionForDate(businessId, date).then(function(collection){

                if(collection !== self.collection){
                    self.collection && self.collection.$destroy && self.collection.$destroy();
                    self.latestEvent = null;
                    self.collection = null;

                    self.collection = collection;
                    self.collection.$watch(watchSelfCollection)
                }
                setLatestEvent();
                sortEvents({clock : clock});
            });

        };


        /**
         * Check if self.collection has the same subName & businessId as the current request
         * @param businessId
         * @param subName
         * @param date
         * @returns {exports.collection|*|model.collection|null|Package.collection|collection}
         */
        var isSameAsSelfCollection = function(businessId, subName, date){
            if(!businessId){
                throw new EventsCollectionException('isSameAsSelfCollection requires provide a businessId');
            }
            if(!subName && !DateHelpers.isMomentValid(date)){
                throw new EventsCollectionException('isSameAsSelfCollection requires either a valid subName or a valid Moment');
            }
            if(!subName) subName = subNameByDate(date);
            return (self.collection && self.collection.businessId == businessId && self.collection.subName == subName);
        }


        /**
         * watcher for self.collection, invoked each time a change occurres in Firebase
         * @param watchDetails
         */
        var watchSelfCollection = function(watchDetails){
            if(!watchDetails) return;
            switch(watchDetails.event){
                case 'child_added':
                    var record = self.collection.$getRecord(watchDetails.key);
                    if(record){
                        var msg = $filter('translate')('EVENT_ADDED') + '\n' + record.data.name + ' - ' + record.data.startTime.format('HH:mm');
                        EventsNotificationsHolder.alert.setMsg(msg);
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
            setLatestEvent();
            sortEvents();
        }



        /**
         * find the latest event(by start time) from self.collection
         */
        var setLatestEvent = function(){
            var currentEvent, key, result = null;
            if(self.collection && self.collection.length){
                for (var i = 0; i< self.collection.length; ++i) {
                    key = self.collection.$keyAt(i);
                    currentEvent = self.collection.$getRecord(key);
                    result = result ? (currentEvent.data.startTime.isAfter(result.data.startTime,'minutes') ? currentEvent : result) : currentEvent ;
                }
            }
           self.latestEvent = result;
        }


        /***
         * Sort events, save sorted results in self.sorted = {pastEvents : [], nowEvents : [], upcomingEvents : [], deadEvents : []}
         * @param filters dictionary with filter : query, status, shift, clock
         * @param options dictionary with options : includePastEvents, includeAllUpcomingEvents
         */
        var sortEvents = this.sortEvents = function(filters, options){

            $log.debug('[EventsCollection] sort event with filters and options : ',filters, options);

            filters = angular.extend({
                query : null,
                status:'ALL',
                shift:null,
                clock:null
            },self.recentFilters,filters);


            options = angular.extend({},
                {
                includePastEvents : true,
                includeAllUpcomingEvents : false
                },
                self.recentOptions, options);

            if(filters === self.recentFilters && options === self.recentOptions){
                return;
            }



            if(self.collection && self.collection.length){
                try{
                    var sorted = $filter('sortDayEvents')(self.collection, filters, options);
                }catch(e){
                    $log.error('Error sorting events : ', e);
                }

                angular.extend(self.sorted, sorted);
                self.recentFilters = filters;
                self.recentOptions = options;
            }else{
                self.sorted.deadEvents = null;
                self.sorted.nowEvents = null;
                self.sorted.upcomingEvents = null;
            }

            $rootScope.$broadcast('$EventsCollectionUpdated');
        };


        /**
         * Get the max time for a cobination of startTime and seats or for an event
         * @param startTime Moment object
         * @param seats dictionary with the seats to check
         * @param event - Event
         * @returns {*}
         */
        this.maxDurationForStartTime = function (startTime, seats, event) {
            if(startTime && seats){
                if(!DateHelpers.isMomentValid(startTime)){
                    throw new EventsCollectionException('maxDurationForStartTime requires a valid Moment object as (startTime)');
                }
            }else if(event && event instanceof Event){

            }else{
                throw new EventsCollectionException('maxDurationForStartTime requires either a valid Event object or startTime and seats');
            }

            seats = seats || event.data.seats;
            startTime = startTime || event.data.startTime;

            return fetchCollectionForDate(BusinessHolder.business.$id, null, event).then(function(collection){
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


        /**
         * Create new event
         * @param data
         * @returns {*}
         */
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
            return fetchCollectionForDate(BusinessHolder.business.$id, null, event).then(function(collection){

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
            return fetchCollectionForDate(BusinessHolder.business.$id,null,event).then(function(collection){
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
            $log.debug('[EventsCollection] saveWithValidation, event with name : ' + event.data.name);
            return self.beforeSave(event, seatingOptionsToValidate).then(function (result) {
                $log.debug('[EventsCollection] saveWithValidation, before save passed with ' + (result.warnings ? result.warnings.length : 0) + ' warnings');
                if (!approveAllWarnings && (result && result.warnings && result.warnings.length)) {
                    return result;
                } else {
                    return self.saveAfterValidation(event);
                }
            });
        };


        this.saveAfterValidation = function (event) {
            $log.debug('[EventsCollection] saveAfterValidation, event with name : ' + event.data.name);


            return fetchCollectionForDate(BusinessHolder.business.$id, null, event).then(function(collection){
                if(event.changedBaseDate){
                    return fetchCollectionForDate(BusinessHolder.business.$id, event.changedBaseDate).then(function(oldCollection){
                        var eventDataCloned = event.toObject();
                        isJustChangedBaseDateForEvent = true;
                        return collection.$add(eventDataCloned).then(function(snap){
                            loadEventsForDate(null, event.data.startTime,event.data.startTime);
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
                            $log.debug('[EventsCollection] saveAfterValidation success, saved as a new event with id : ' + snap.name());

                            sortEvents();
                            var addedEvent=self.collection.$getRecord(snap.name())
                            updateCustomerForEvent(addedEvent);
                        });
                    } else {
                        return collection.$save(event).then(function(){
                            $log.debug('[EventsCollection] saveAfterValidation success, updated existing event with id : ' + event.$id);

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
            return fetchCollectionForDate(BusinessHolder.business.$id, null, event).then(function(collection){
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
            if(DateHelpers.areMomentsHaveSameDates(oldBaseDateMoment, newBaseDateMoment) ){
                var defer = $q.defer();
                defer.resolve();
                return defer.promise;
            }

            event.$changeBaseDate(newBaseDateMoment);


            return fetchCollectionForDate(BusinessHolder.business.$id, newBaseDateMoment).then(function(newCollection){
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
            self.loadEventsForDate();
        });

        //TODO: get rid of them
//        $rootScope.$on('$dateWasChanged', function(){
//            loadCurrentEvents();
//        });
//
//        $rootScope.$on('$clockWasChanged', function(){
//            sortEvents();
//        });
//
//        $rootScope.$on('$requestSortEvents', function(){
//            sortEvents();
//        });
//
//        $rootScope.$watch(function(){
//            return self.filters.query;
//        }, function(){
//            sortEvents();
//        });
//
//        $rootScope.$watch(function(){
//            return self.filters.status;
//        }, function(){
//            sortEvents();
//        });


        var reset = function(){
            self.collection && self.collection.$destory && self.collection.$destory();
            self.collection = null;
            self.sorted = {};
            self.recentFilters = {};
            self.recentOptions  = {};
        }

        $rootScope.$on('$firebaseSimpleLogin:logout', reset);
    });



