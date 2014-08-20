var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .service('OccasionalEvent', function(EventsStatusesHolder){
        return _.findWhere(EventsStatusesHolder, {status : 'OCCASIONAL'});
    })
    .service('OrderedEvent', function(EventsStatusesHolder){
        return _.findWhere(EventsStatusesHolder, {status : 'ORDERED'});
    })
    .value('NotCollidingEventStatuses', ['NO_SHOW','FINISHED','CANCELED'])
    .factory('$event', function(){

    });


    function Event(dependencies, $firebaseObject, data){
        this.initDependencies(dependencies);

        if($firebaseObject &&  typeof $firebaseObject == 'AngularFire'){
            return this.initWithFirebaseRef($firebaseObject);
        }else if(data){
            return this.initAsyncWithData(data);
        }else{
            throw new TypeError("please provide either a valid $angularfire object or event data");
        }

    };

    Event.prototype = {

        initDependencies : function(dependencies){
            angular.extend(this, dependencies);
            var expectedDependencies = ['_$q','_DateHolder','_DateHelpers',
                '_EventsCollection','_EventsDurationForGuestsHolder','_OrderedEvent',
                '_OccasionalEvent','_$filter','_BusinessHolder','_GuestsPer15',
                '_ShiftsDayHolder', 'NotCollidingEventStatuses'];
            for (var i = 0; i < expectedDependencies.length; ++i){
                if(!this[expectedDependencies[i]]){
                    throw new TypeError('missing ' + expectedDependencies[i] + ' dependency');
                }
            }
        },
        initWithFirebaseRef : function($firebaseObject){
            if(this.initialized) throw new TypeError("init methods can be called only once");
            this.initialized = true;
            return this;
        },
        initAsyncWithData : function(data){
            if(this.initialized) throw new TypeError("init methods can be called only once");
            this.initialized = true;
            this.initting = this._$q.defer();

            this.$event = {};

            // determine if the event is 'destination' or 'occasional'
            this.$event.isOccasional = (data.occasionalOrDestination == 'occasional')
            this.$event.status =  this.$event.isOccasional ? this._OccasionalEvent : this._OrderedEvent;

            // set the start time
            var startTime = data.specificStartTime || (this.$event.isOccasional ? new Date() : this._DateHolder.currentClock);
            if(!startTime) throw new TypeError("create new event due to invalid start time");
            startTime = this._DateHelpers.findClosestIntervalToDate(startTime);
            this.$event.startTime = moment(startTime).seconds(0);

            // find the duration for the event and set the end time
            var maxDurationForEvent = this._EventsCollection.maxDurationForStartTime(this.$event.startTime);
            if(maxDurationForEvent === 0) throw new TypeError("cannot create new event with the current startTime due to collisions");
            var duration = this._EventsDurationForGuestsHolder.default || 120;
            duration = Math.min(duration, maxDurationForEvent);
            this.$event.endTime = endTimeWithDuration(duration);
            if(!this.$event.endTime) throw new TypeError("cannot create new event due to failure in setting the end time");

            // set the events seats dictionary
            if(!data.seatsDic) throw new TypeError('create new event due to invalid seats object.');
            this.$event.seats = seatsDic;

            // set name
            this.$event.name = this.$event.isOccasional ? $filter('translate')('OCCASIONAL') : '';

            // set createdAt date
            this.$event.createdAt = new Date();

            // enter editing mode
            this.enterEditingMode();

            this.initting.resolve(this);
            return this.initting;
        },

        // ------ Validators (major errors) ------ //
        /**
         * validates  this.name
         * @returns {promise}
         */
        validateName : function(){
            var defer = $q.defer();
            if(!this.$event.name){
                defer.reject({error : "ERROR_EVENT_MSG_NAME"});
            }else{
                defer.resolve(this);
            }
            return defer.promise;
        },
        /**
         * validates this.seats
         * @returns {promise}
         */
        validateSeats : function(){
            var defer = $q.defer();
            if(this.areNoSeats() && (this._BusinessHolder.businessType != 'Bar' || !this.$event.isOccasional)){
                defer.reject({error : "ERROR_EVENT_MSG_SEATS"});
            }else{
                defer.resolve(this);
            }
            return defer.promise;
        },

        /**
         * validate this.hostess
         * @returns {promise}
         */
        validateHostess : function(){
            var defer = $q.defer();
            if(!this.$event.hostess && this._BusinessHolder.businessType != 'Bar' && !this.$event.isOccasional){
                defer.reject({error : "ERROR_EVENT_MSG_HOST"});
            }else{
                defer.resolve(this);
            }
            return defer.promise;
        },
        /**
         * validates this.phone
         * @returns {promise}
         */
        validatePhone : function(){
            var defer = $q.defer();
            if(!this.$event.isOccasional && !this.$event.phone){
                defer.reject({error : "ERROR_EVENT_MSG_PHONE"});
            }else{
                defer.resolve(this);
            }
            return defer.promise;
        },
        /**
         * validates this.startTime
         * @returns {promise}
         */
        validateStartTime : function(){
            var defer = $q.defer();
            if(!this.$event.startTime || !this.$event.startTime.isValid || !this.$event.startTime.isValid()){
                defer.reject({error : "ERROR_EVENT_MSG_STARTTIME"});
            }else{
                defer.resolve(this);
            }
            return defer.promise;
        },
        /**
         * validates this.endTime
         * @returns {promise}
         */
        validateEndTime : function(){
            var defer = $q.defer();
            if(!this.$event.endTime || !this.$event.endTime.isValid || !this.$event.endTime.isValid()){
                defer.reject({error : "ERROR_EVENT_MSG_ENDTIME"});
            } else if (!this.$event.endTime.isAfter(this.$event.startTime, 'minutes')){
                defer.reject({error : "ERROR_EVENT_MSG_ENDTIME_LT_STARTTIME"});
            }else{
                defer.resolve(this);
            }
            return defer.promise;
        },


        /**
         * validates this for collisions
         * @returns {promise}
         */
        validateCollision : function(){
            var defer = $q.defer();
            if(this._EventCollection.checkCollisionsForEvent(this)){
                defer.reject({error : "ERROR_EVENT_MSG_COLLISION"});
            }else{
                defer.resolve(event);
            }
            return defer.promise;
        },

        // ------ Checks (warnings) ------ //


        /**
         * check all the available warnings for the event
         * @returns {Promise|*}
         */
        checkAllWarnings : function(){
            var warnings = {warnings : []};
            var promises = [this.checkGuestsPer15Minutes(), this.checkIfEventWithinShifts()];

            return $q.all(promises).then(function(result){
                for (var i =0; i < result.length; ++i){
                    if(result[i]) warnings.warnings.push(result[i]);
                }
                return warnings;
            });
        },

        /**
         * checks the guests per 15 minutes limitation on the event
         * @returns {promise}
         */
        checkGuestsPer15Minutes : function(){
            var defer = $q.defer();
            if(!this.isGuestsPer15Valid()){
                defer.resolve({warning : "INVALID_GUESTS_PER_15_WARNING"});
            }else{
                defer.resolve();
            }
            return defer.promise;
        },

        /**
         * checks if the event is within the shifts
         * @returns {Function||promise|promise|promise|HTMLElement|*}
         */
        checkIfEventWithinShifts : function(){
            var defer = $q.defer();

            this.isEventWithinTodayShifts().then(function(result){
                if(result){
                    defer.resolve();
                }else{
                    defer.resolve({warning : "WARNING_OUT_OF_SHIFTS"});
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
        endTimeWithDuration : function(minutes){
            if(!minutes || minutes == 0) return false;
            if(!this.$event.startTime) return false;
            return this.$event.startTime.clone().add(minutes, 'minutes');
        },
        /**
         * helper function to determine if the event has seats
         * @returns {*}
         */
        areNoSeats : function(){
            return isEmptyObject(this.$event.seats)
        },
        /**
         * check guests per 15 limitation for an event
         * @returns {boolean}
         */
        isGuestsPer15Valid : function(){
            var guestPer15Value = parseInt(this._GuestsPer15.$value);
            if(!guestPer15Value || guestPer15Value === 0 || !this.$event.guests) return true;
            if(!this.$event.startTime) return false;
            var guestsCount = _.reduce(EventsCollection.$allEvents, function(guestsCount, _event, key){
                if(!_event || key == '$id' || typeof _event == "function" || _event === event) return guestsCount;
                var eventStartTimeMoment = moment(_event.startTime);
                if(!_event.isOccasional && self.startTime.isSame(eventStartTimeMoment,'minutes')){
                    return parseInt(guestsCount) + parseInt(_event.guests);
                }else{
                    return guestsCount;
                }
            }, 0);
            guestsCount += parseInt(event.guests);
            return guestsCount <= guestPer15Value;
        },
        /**
         * checks if event is within today's/yesterday's shifts
         * @returns {BOOL}
         */
        isEventWithinShifts : function(){
            var self = this;
            return self.checkIfEventIsWithinDayShifts(self.$event.startTime).then(function(result){
                // check the day before
                var theDayBefore = self.$event.startTime.subtract(1, 'days');
                return self.checkIfEventIsWithinDayShifts(theDayBefore);
            });
        },
        checkIfEventIsWithinDayShifts : function(dateMoment){
            if(!dateMoment || !dateMoment.isValid || !dateMoment.isValid()) throw new TypeError('cannot check if event is within a day shifts, because the date is invalid');
            return this._ShiftsDayHolder.dayShiftsForDate(dateMoment).then(function(dayShifts){
                var shifts = dayShifts.shifts, _currentShift
                for (var i = 0; i < shifts.length; ++i){
                    _currentShift = shifts[i];
                    if(_currentShift.isContainingEvent(event)){
                        return true;
                    }
                }
                return false;
            });
        },
        /**
         * return TRUE if the event is a colliding event
         * means that its status isn't in the notCollidingEventStatuses array : 'NO_SHOW','FINISHED','CANCELED'
         * @returns {boolean}
         */
        shouldCollide : function(){
            return (this.$event.status && this.$event.status.status) ? (NotCollidingEventStatuses.indexOf(this.$event.status.status) == -1) : false ;
        },

        enterEditingMode : function (event){
            var maxDurationForEvent = this._EventsCollection.maxDurationForStartTime(this.$event.startTime);
            this.helpers = this.helpers || {};
            this.helpers.maxDuration = maxDurationForEvent;
            this.helpers.isEditing = true;
            return true;
        },

        beforeSave : function(){
            return this.validateCollision().
                then(this.validatePhone()).
                then(this.validateName).
                then(this.validateStartTime).
                then(this.validateEndTime).
                then(this.validateSeats()).
                then(this.validateHostess).
                then(this.checkAllWarnings);
        },

        save : function(approveAllWarnings){
            var self = this;
            return self.beforeSave().then(function(result){
                if(!approveAllWarnings && result.warnings){
                    return result;
                }else{
                    self.saveAfterValidation();
                }
            });
        },

        saveAfterValidation : function(){
            if(this.isNew()){
                this._EventsCollection.$add(this.$event);
            }else{
                this.$event.$save();
            }
        },

        isNew : function(){
            return !this.$id;
        }



};

