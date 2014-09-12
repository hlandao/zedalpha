var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .value('NotCollidingEventStatuses', ['NO_SHOW', 'FINISHED', 'CANCELED'])
    .factory('Event', function ($q, DateHolder, DateHelpers, $injector, $filter, BusinessHolder, ShiftsDayHolder, NotCollidingEventStatuses,DateFormatFirebase) {

        function Event(snapshot, newEventData) {
            if (snapshot) {
                return this.$initWithFirebaseSnapshot(snapshot);
            } else if (newEventData) {
                return this.$initNewEvent(newEventData);
            } else {
                return this;
            }
        };


        Event.prototype = {

            $initWithFirebaseSnapshot: function (snapshot) {
                if (this.initialized) throw new TypeError("init methods can be called only once");
                this.initialized = true;
                this.$id = snapshot.name();
                this.data = angular.extend({}, snapshot.val());
                this.data.startTime = moment(this.data.startTime);
                this.data.endTime = moment(this.data.endTime);
                this.data.guests = this.data.guests || 0;

                return this;
            },
            $initNewEvent: function (newEventData) {
                if (this.initialized) throw new TypeError("init methods can be called only once");
                this.initialized = true;

                this.data = {};

                // determine if the event is 'destination' or 'occasional'
                this.data.isOccasional = (newEventData.occasionalOrDestination && newEventData.occasionalOrDestination == 'occasional')
                this.data.status = this.data.isOccasional ? 'OCCASIONAL' : 'ORDERED';


                // set the start time
                var startTime = newEventData.startTime || (this.data.isOccasional ? moment(Date.now()) : DateHolder.currentClock.clone());
                if (!startTime || !startTime.isValid || !startTime.isValid()) throw new TypeError("cannot create new event due to invalid start time, should be a moment obj.");
                startTime.minute(DateHelpers.findClosestIntervalToDate(startTime));
                this.data.startTime = startTime.seconds(0);

                var baseDate = newEventData.baseDate || DateHolder.currentDate || this.data.startTime;
                this.data.baseDate = baseDate.format(DateFormatFirebase);

                // find the duration for the event and set the end time
                var duration = BusinessHolder.business.eventsDurationForGuests.default || 120;
                this.$setEndTimeWithDuration(duration);
                if (!this.data.endTime || !this.data.endTime.isValid || !this.data.endTime.isValid()) throw new TypeError("cannot create new event due to failure in setting the end time,should be a moment obj.");

                // set the events seats dictionary
                this.data.seats = newEventData.seatsDic;

                // set name
                this.data.name = this.data.isOccasional ? $filter('translate')('OCCASIONAL') : '';

                // set createdAt date
                this.data.createdAt = new Date();
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
            $validateName: function (value) {
                value = value || this.data.name;
                var defer = $q.defer();
                if (!value) {
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
            $validateSeats: function (value) {
                value = value || this.data.seats;
                var defer = $q.defer();
                if (this.$noSeats() && (BusinessHolder.businessType != 'Bar' && !this.data.isOccasional)) {
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
            $validatePhone: function (value) {
                value = value || this.data.phone;
                var defer = $q.defer();
                if (!this.data.isOccasional && !value) {
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
                if (!this.data.endTime || !this.data.endTime.isValid || !this.data.endTime.isValid()) {
                    defer.reject({error: "ERROR_EVENT_MSG_ENDTIME"});
                } else if (!this.data.endTime.isAfter(this.data.startTime, 'minutes')) {
                    defer.reject({error: "ERROR_EVENT_MSG_ENDTIME_LT_STARTTIME"});
                } else {
                    defer.resolve();
                }
                return defer.promise;
            },



            // ------ Checks (warnings) ------ //

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
            $setEndTimeWithDuration: function (minutes, startTime) {
                this.data.endTime = this.$getEndTimeWithDuration(minutes, startTime);
            },
            $getEndTimeWithDuration: function (minutes, startTime) {
                startTime = startTime || this.data.startTime;
                if (!minutes || minutes == 0) return false;
                if (!startTime) return false;
                return startTime.clone().add(minutes, 'minutes');
            },

            $setEndTimeByMaxDuartion: function(maxDuration, duration, startTime){
                duration = duration || this.$getDuration();
                duration = maxDuration >= 0 ? Math.min(duration, maxDuration) : duration;
                this.$setEndTimeWithDuration(duration, startTime);
            },

            $getDuration : function(){
                return this.data.endTime.diff(this.data.startTime, 'minutes');
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
                return (this.data.status) ? (NotCollidingEventStatuses.indexOf(this.data.status) == -1) : false;
            },

            $sharingTheSameSeatsWithAnotherEvent: function (anotherEvent, seats) {
                seats = anotherEvent ? anotherEvent.data.seats : seats;
                if(!seats) return;

                if(seats && !isEmptyObject(seats)){
                    for (var i  in this.data.seats) {
                        if (seats[i]) return true;
                    }
                }
                return false;
            },

            $collideWithAnotherEvent : function(anotherEvent, anotherStartTime, anotherEndTime){
                if(!anotherEvent) return false;

                anotherStartTime = anotherStartTime || anotherEvent.data.startTime;
                anotherEndTime = anotherEndTime || anotherEvent.data.endTime;


                var startTimeToStartTimeDiff = anotherStartTime.diff(this.data.startTime, 'minutes'),
                    startTimeToEndTimeDiff = anotherStartTime.diff(this.data.endTime, 'minutes'),
                    endTimeToStartTimeDiff = anotherEndTime.diff(this.data.startTime, 'minutes'),
                    endTimeToEndTimeDiff  = anotherEndTime.diff(this.data.endTime, 'minutes');

                if((startTimeToStartTimeDiff >= 0 && startTimeToEndTimeDiff <= 0) || (endTimeToStartTimeDiff > 0 && endTimeToEndTimeDiff <= 0)){
                    return true;
                }

                return false;
            },

            $maxDurationInRegardToAnotherEvent: function (anotherEvent, startTime) {
                startTime = anotherEvent ? anotherEvent.data.startTime : startTime;
                if (!startTime) return false;

                var startTimeDiff = Math.round(this.data.startTime.diff(startTime, 'minutes',true));
                var startTimeEndTimeDiff = Math.round(startTime.diff(this.data.endTime, 'minutes',true));
                if (startTimeDiff > 0) {
                    // anotherEvent starts and ends before this event begins
                    return startTimeDiff;
                } else if (startTimeEndTimeDiff >= 0) {
                    // this start after anotherEvent ends
                    return -1;
                } else {
                    return 0;
                }
            },




            $isNew: function () {
                return !this.$id;
            },

            toJSON: function () {
                output = angular.extend({},this.data);
                if(!output.seats) output.seats = null;
                output.startTime = output.startTime.toJSON();
                output.endTime = output.endTime.toJSON();
                return output;
            },

            toObject: function () {
                output = angular.extend({},this.data);
                if(!output.seats) output.seats = null;
                output.startTime = output.startTime.toJSON();
                output.endTime = output.endTime.toJSON();
                return output;
            },

            $clone : function(){
                var newEvent = new Event();
                newEvent.data = angular.extend({}, this.data);
                return newEvent;
            },

            $enterEditingMode: function(){
                this.editing = true;
//                this.clonedData = angular.extend({}, this.data);
            },
            $exitEditingMode: function(restoreData){
                this.editing = false;
                if(restoreData && this.clonedData){
                    this.data = angular.extend({}, this.clonedData);
                }
                this.clonedData = null;
            },
            $isEditing : function(){
                return this.editing;
            },
            $changeBaseDate : function(newVal){
              var daysDiff = moment(newVal).diff(moment(this.data.baseDate), 'days');
                this.data.startTime.add(daysDiff, 'days');
                this.data.endTime.add(daysDiff, 'days');
                this.data.baseDate = moment(newVal).format(DateFormatFirebase);
            },
            getCollectionAsync : function(){
                var defer = $q.defer();
                defer.resolve(this.collection);
                return defer.promise;
            }

        };

        return Event;
    });



