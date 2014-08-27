var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .value('NotCollidingEventStatuses', ['NO_SHOW', 'FINISHED', 'CANCELED'])
    .factory('Event', function ($q, DateHolder, DateHelpers, $injector, $filter, BusinessHolder, ShiftsDayHolder, NotCollidingEventStatuses) {
        var OccasionalEvent = _.findWhere(BusinessHolder.eventsStatuses, {status: 'OCCASIONAL'}),
            OrderedEvent = _.findWhere(BusinessHolder.eventsStatuses, {status: 'ORDERED'});

        function Event(snapshot, newEventData, holder) {
            this.holder = holder;
            if (snapshot) {
                return this.$initWithFirebaseSnapshot(snapshot);
            } else if (newEventData) {
                return this.$initNewEventAsync(newEventData);
            } else {
                throw new TypeError("please provide either a valid snapshot object or new event data");
            }

        };


        Event.prototype = {

            $initWithFirebaseSnapshot: function (snapshot) {
                if (this.initialized) throw new TypeError("init methods can be called only once");
                this.initialized = true;

                this.data = angular.extend({}, snapshot.val());
                this.data.startTime = moment(this.data.startTime);
                this.data.endTime = moment(this.data.endTime);

                return this;
            },
            $initNewEventAsync: function (data) {
                if (this.initialized) throw new TypeError("init methods can be called only once");
                this.initialized = true;
                this.initting = $q.defer();

                this.data = {};

                // determine if the event is 'destination' or 'occasional'
                this.data.isOccasional = (data.occasionalOrDestination == 'occasional')
                this.data.status = this.data.isOccasional ? OccasionalEvent : OrderedEvent;

                // set the start time
                var startTime = data.specificStartTime || (this.data.isOccasional ? new Date() : DateHolder.currentClock);
                if (!startTime) throw new TypeError("cannot create new event due to invalid start time");
                startTime = DateHelpers.findClosestIntervalToDate(startTime);
                this.data.startTime = moment(startTime).seconds(0);

                // find the duration for the event and set the end time
                var maxDurationForEvent = this.holder.maxEventDurationForStartTime(this.data.startTime);
                if (maxDurationForEvent === 0) throw new TypeError("cannot create new event with the current startTime due to possible collisions");
                var duration = BusinessHolder.eventsDurationForGuests.default || 120;
                duration = Math.min(duration, maxDurationForEvent);
                this.data.endTime = this.$endTimeWithDuration(duration);
                if (!this.data.endTime) throw new TypeError("cannot create new event due to failure in setting the end time");

                // set the events seats dictionary
                if (!data.seatsDic) throw new TypeError('cannot create new event due to invalid seats object.');
                this.data.seats = seatsDic;

                // set name
                this.data.name = this.data.isOccasional ? $filter('translate')('OCCASIONAL') : '';

                // set createdAt date
                this.data.createdAt = new Date();

                // enter editing mode
                this.$enterEditingMode();

                this.initting.resolve(this);
                return this;
            },

            $update: function (snapshot) {
                angular.extend(this.data, snapshot.val());
                this.data.startTime = moment(this.data.startTime);
                this.data.endTime = moment(this.data.endTime);

            },

            // ------ Validators (major errors) ------ //
            /**
             * validates  this.name
             * @returns {promise}
             */
            $validateName: function () {
                var defer = $q.defer();
                if (!this.data.name) {
                    defer.reject({error: "ERROR_EVENT_MSG_NAME"});
                } else {
                    defer.resolve();
                }
                return defer.promise;
            },
            /**
             * validates this.seats
             * @returns {promise}
             */
            $validateSeats: function () {
                var defer = $q.defer();
                if (this.$noSeats() && (BusinessHolder.businessType != 'Bar' || !this.data.isOccasional)) {
                    defer.reject({error: "ERROR_EVENT_MSG_SEATS"});
                } else {
                    defer.resolve();
                }
                return defer.promise;
            },

            /**
             * validate this.hostess
             * @returns {promise}
             */
            $validateHostess: function () {
                var defer = $q.defer();
                if (!this.data.hostess && BusinessHolder.businessType != 'Bar' && !this.data.isOccasional) {
                    defer.reject({error: "ERROR_EVENT_MSG_HOST"});
                } else {
                    defer.resolve();
                }
                return defer.promise;
            },
            /**
             * validates this.phone
             * @returns {promise}
             */
            $validatePhone: function () {
                var defer = $q.defer();
                if (!this.data.isOccasional && !this.phone) {
                    defer.reject({error: "ERROR_EVENT_MSG_PHONE"});
                } else {
                    defer.resolve();
                }
                return defer.promise;
            },
            /**
             * validates this.startTime
             * @returns {promise}
             */
            $validateStartTime: function () {
                var defer = $q.defer();
                if (!this.data.startTime || !this.data.startTime.isValid || !this.data.startTime.isValid()) {
                    defer.reject({error: "ERROR_EVENT_MSG_STARTTIME"});
                } else {
                    defer.resolve();
                }
                return defer.promise;
            },
            /**
             * validates this.endTime
             * @returns {promise}
             */
            $validateEndTime: function () {
                var defer = $q.defer();
                if (!this.data.endTime || !this.endTime.data.isValid || !this.endTime.data.isValid()) {
                    defer.reject({error: "ERROR_EVENT_MSG_ENDTIME"});
                } else if (!this.data.endTime.isAfter(this.data.startTime, 'minutes')) {
                    defer.reject({error: "ERROR_EVENT_MSG_ENDTIME_LT_STARTTIME"});
                } else {
                    defer.resolve();
                }
                return defer.promise;
            },


            /**
             * validates this for collisions
             * @returns {promise}
             */
            $validateCollision: function () {
                var defer = $q.defer();
                if (EventCollection.checkCollisionsForEvent(this)) {
                    defer.reject({error: "ERROR_EVENT_MSG_COLLISION"});
                } else {
                    defer.resolve();
                }
                return defer.promise;
            },

            // ------ Checks (warnings) ------ //


            /**
             * check all the available warnings for the event
             * @returns {Promise|*}
             */
            $checkAllWarnings: function () {
                var warnings = {warnings: []};
                var promises = [this.$checkGuestsPer15Minutes(), this.$checkIfEventFitsShifts()];

                return $q.all(promises).then(function (result) {
                    for (var i = 0; i < result.length; ++i) {
                        if (result[i]) warnings.warnings.push(result[i]);
                    }
                    return warnings;
                });
            },

            /**
             * checks the guests per 15 minutes limitation on the event
             * @returns {promise}
             */
            $checkGuestsPer15Minutes: function () {
                var defer = $q.defer();
                if (!this.holder.isGuestsPer15ValidForNewEvent(this)) {
                    defer.resolve({warning: "INVALID_GUESTS_PER_15_WARNING"});
                } else {
                    defer.resolve();
                }
                return defer.promise;
            },

            /**
             * checks if the event is within the shifts
             * @returns {Function||promise|promise|promise|HTMLElement|*}
             */
            $checkIfEventFitsShifts: function () {
                var defer = $q.defer();

                return ShiftsDayHolder.$checkIfEventFitsShifts(this).then(function (result) {
                    if (result) {
                        return null;
                    } else {
                        return {warning: "WARNING_OUT_OF_SHIFTS"};
                    }
                });


                return defer.promise;
            },


// ------ Helpers ------ //
            /**
             * return new end time for an event based on its start time and duration in minutes
             * @param minutes
             * @returns {*}
             */
            $endTimeWithDuration: function (minutes) {
                if (!minutes || minutes == 0) return false;
                if (!this.data.startTime) return false;
                return this.data.startTime.clone().add(minutes, 'minutes');
            },
            /**
             * helper function to determine if the event has seats
             * @returns {*}
             */
            $noSeats: function () {
                return isEmptyObject(this.data.seats)
            },
            /**
             * return TRUE if the event is a colliding event
             * means that its status isn't in the notCollidingEventStatuses array : 'NO_SHOW','FINISHED','CANCELED'
             * @returns {boolean}
             */
            $shouldCollide: function () {
                return (this.data.status && this.data.status.status) ? (NotCollidingEventStatuses.indexOf(this.data.status.status) == -1) : false;
            },

            $sharingTheSameSeatsWithAnotherEvent: function (anotherEvent) {
                for (var i  in this.data.seats) {
                    if (anotherEvent.data.seats[i]) return true;
                }
                return false;
            },

            $maxDurationForEventInRegardToAnotherEvent: function (anotherEvent) {
                if (!anotherEvent) return false;

                var startTimeDiff = anotherEvent.data.startTime.diff(this.data.startTime, 'minutes');

                if (startTimeDiff > 0) {
                    // this start before anotherEvent begins
                    return e2StartTimeDiffEventToCheckStartTime;
                } else if (this.data.startTime.isAfter(anotherEvent.data.endTime, 'minutes') || anotherEvent.data.endTime.isSame(this.data.startTime, 'minutes')) {
                    // this start after anotherEvent ends
                    return -1;
                } else {
                    return 0;
                }

            },

            $enterEditingMode: function (event) {
                var maxDurationForEvent = this.holder.maxEventDurationForStartTime(this.startTime);
                this.helpers = this.helpers || {};
                this.helpers.maxDuration = maxDurationForEvent;
                this.helpers.isEditing = true;
                return true;
            },

            $exitEditingMode: function (event) {
                this.helpers.isEditing = false;
                return true;
            },


            $beforeSave: function () {
                return this.$validateCollision().
                    then(this.$validatePhone).
                    then(this.$validateName).
                    then(this.$validateStartTime).
                    then(this.$validateEndTime).
                    then(this.$validateSeats).
                    then(this.$validateHostess).
                    then(this.$checkAllWarnings);
            },

            $saveWithValidation: function (approveAllWarnings) {
                var self = this;
                return self.$beforeSave().then(function (result) {
                    if (!approveAllWarnings && result.warnings) {
                        return result;
                    } else {
                        self.$saveAfterValidation();
                    }
                });
            },

            $saveAfterValidation: function () {
                if (this.$isNew()) {
                    this.holder.collection.$add(this.$event);
                } else {
                    this.holder.collection.$save(this);
                }
            },

            $isNew: function () {
                return !this.$id;
            },

            toJSON: function () {
                return JSON.stringify(this.data);
            },


        };

        return Event;
    });



