var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('Event', function ($q, DateHolder, DateHelpers, $injector, $filter, BusinessHolder, ShiftsDayHolder, NotCollidingEventStatuses,DateFormatFirebase,DeadEventsStatuses) {

        function EventModelException(message) {
            this.name = 'EventModelException';
            this.message= message;
        }
        EventModelException.prototype = new Error();
        EventModelException.prototype.constructor = EventModelException;


        function Event(snapshot, newEventData, eventData) {
            if (snapshot) {
                return this.$initWithFirebaseSnapshot(snapshot);
            } else if (newEventData) {
                return this.$initNewEvent(newEventData);
            }else if(eventData){
                return this.$initWithEventData(eventData);
            } else {
                return this;
            }
        };

        angular.extend(Event.prototype, {

            $initWithFirebaseSnapshot: function (snapshot) {
                if (this.initialized) throw new TypeError("init methods can be called only once");
                this.initialized = true;
                this.$id = snapshot.name();
                this.data = angular.extend({}, snapshot.val());
                this.data.startTime = moment(this.data.startTime).seconds(0);
                this.data.endTime = moment(this.data.endTime).seconds(0);
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
                var startTime = newEventData.startTime || (this.data.isOccasional ? moment() : DateHolder.currentClock.clone());
                if (!startTime || !startTime.isValid || !startTime.isValid()) throw new TypeError("cannot create new event due to invalid start time, should be a moment obj.");
                startTime.minute(DateHelpers.findClosestIntervalToDate(startTime));
                this.data.startTime = startTime.seconds(0);

                var baseDate = newEventData.baseDate || DateHolder.currentDate.clone() || this.data.startTime;
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
                this.data.createdAt = moment().toJSON();
                return this;
            },

            $initWithEventData : function(eventData){
                this.data = {};
                angular.extend(this.data,eventData);
                return this;
            },
            $update: function (snapshot) {
                angular.extend(this.data, snapshot.val());
                this.data.startTime = moment(this.data.startTime);
                this.data.endTime = moment(this.data.endTime);
            },




            // ------ Async Validators (major errors) ------ //

            $runAllSyncValidatorsWithPromise : function(){
                var self = this;
                var nameAsyncValidator = angular.bind(self, self.$validateAsync, '$validateName');
                var seatsAsyncValidator = angular.bind(self, self.$validateAsync, '$validateSeats');
                var hostessAsyncValidator = angular.bind(self, self.$validateAsync, '$validateHostess');
                var phoneAsyncValidator = angular.bind(self, self.$validateAsync, '$validatePhone');
                var startTimeAsyncValidator = angular.bind(self, self.$validateAsync, '$validateStartTime');
                var endTimeAsyncValidator = angular.bind(self, self.$validateAsync, '$validateEndTime');
                var baseDateAsyncValidator = angular.bind(self, self.$validateAsync, '$validateBaseDate');

                return nameAsyncValidator()
                    .then(phoneAsyncValidator)
                    .then(nameAsyncValidator)
                    .then(startTimeAsyncValidator)
                    .then(endTimeAsyncValidator)
                    .then(baseDateAsyncValidator)
                    .then(seatsAsyncValidator)
                    .then(hostessAsyncValidator);
            },

            /**
             * run one of the validtors async with promise
             * @param validatorFN
             * @param value
             * @returns {*}
             */
            $validateAsync : function (validatorFN, value){
                var defer  = $q.defer();
                if(!angular.isFunction(validatorFN)){
                    validatorFN = this[validatorFN];
                }
                if(angular.isFunction(validatorFN)){
                    var errorResult = validatorFN.call(this, value);
                    if(errorResult && errorResult.error){
                        defer.reject(errorResult);
                    }else{
                        defer.resolve();
                    }
                }else{
                    defer.resolve();
                }
                return defer.promise;
            },
            /**
             * validates  this.name
             * @returns {promise}
             */
            $validateName: function (value) {
                value = value  === undefined ? this.data.name : value;

                if (!value) {
                    return {error: "ERROR_EVENT_MSG_NAME"}
                }
            },
            /**
             * validates this.seats
             * @returns {promise}
             */
            $validateSeats: function (value) {
                value = value  === undefined ? this.data.seats : value;
                if (this.$noSeats(value) && (BusinessHolder.businessType != 'Bar' && !this.data.isOccasional)) {
                    return {error: "ERROR_EVENT_MSG_SEATS"};
                }
            },

            /**
             * validate this.hostess
             * @returns {promise}
             */
            $validateHostess: function (value) {
                value = value || this.data.hostess;
                if (!value && BusinessHolder.businessType != 'Bar' && !this.data.isOccasional) {
                    return {error: "ERROR_EVENT_MSG_HOST"};
                }
            },
            /**
             * validates this.phone
             * @returns {promise}
             */
            $validatePhone: function (value) {
                value = value  === undefined ? this.data.phone : value;
                if (!this.data.isOccasional && !value) {
                    return {error: "ERROR_EVENT_MSG_PHONE"};
                }
            },
            /**
             * validates this.baseDate
             * @returns {promise}
             */
            $validateBaseDate: function (value) {
                value = value  === undefined ? this.data.baseDate : value;
                var startDate;
                if(this.data.startTime.hour() <= 6){
                    startDate = this.data.startTime.clone().subtract(1,'days').format(DateFormatFirebase);
                }else{
                    startDate = this.data.startTime.format(DateFormatFirebase);
                }
                if (value != startDate) {
                    return {error: "ERROR_EVENT_MSG_BASE_DATE"};
                }
            },

            /**
             * validates this.startTime
             * @returns {promise}
             */
            $validateStartTime: function (value) {
                value = value  === undefined ? this.data.startTime : value;
                if (!value || !value.isValid || !value.isValid()) {
                    return {error: "ERROR_EVENT_MSG_STARTTIME"};
                }
            },
            /**
             * validates this.endTime
             * @returns {promise}
             */
            $validateEndTime: function (value) {
                value = value  === undefined ? this.data.endTime : value;
                if (!value || !value.isValid || !value.isValid()) {
                    return {error: "ERROR_EVENT_MSG_ENDTIME"};
                } else if (!value.isAfter(this.data.startTime, 'minutes')) {
                    return {error: "ERROR_EVENT_MSG_ENDTIME_LT_STARTTIME"};
                }
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
                var newEndTime = this.$getAnEndTimeWithDuration(minutes, startTime);
                if(DateHelpers.isMomentValid(newEndTime)){
                    this.data.endTime = newEndTime.seconds(0);
                    return newEndTime;
                }else{
                    throw new EventModelException('Failed setting new end time with duration for reservation');
                }


            },
            $getAnEndTimeWithDuration: function (minutes, startTime) {
                startTime = DateHelpers.isMomentValid(startTime) ? startTime : this.data.startTime;
                if (!minutes || minutes == 0) throw new EventModelException('Cannot set end time without valid minutes duration');
                if (!DateHelpers.isMomentValid(startTime)) throw new EventModelException('Cannot set end time without a valid start time moment');
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
            $noSeats: function (value) {
                value = value || this.data.seats;
                return isEmptyObject(value)
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
                seats = seats || (anotherEvent ? anotherEvent.data.seats : null);
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

                var startBeforeAndEndAfter = (startTimeToStartTimeDiff <= 0 && endTimeToEndTimeDiff >= 0),
                    startAtTheSameTime = startTimeToStartTimeDiff == 0,
                    startInTheMiddle = (startTimeToStartTimeDiff > 0 && startTimeToEndTimeDiff < 0),
                    endInTheMiddle = (endTimeToStartTimeDiff > 0 && endTimeToEndTimeDiff < 0);


                if(startBeforeAndEndAfter||startAtTheSameTime||startInTheMiddle||endInTheMiddle ){
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
            },
            $exitEditingMode: function(){
                this.editing = false;
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
            $isDeadEvent : function(){
              return !!(DeadEventsStatuses.indexOf(this.data.status) > -1);
            },
            getCollectionAsync : function(){
                var defer = $q.defer();
                defer.resolve(this.collection);
                return defer.promise;
            }

        });

        return Event;
    });



