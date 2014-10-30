var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .service('DateHolder', function($rootScope, DateHelpers, DateFormatFirebase,FullDateFormat, $log){

        function DateHolderException(message) {
            this.name = 'DateHolderException';
            this.message= message;
        }
        DateHolderException.prototype = new Error();
        DateHolderException.prototype.constructor = DateHolderException;


        var self = this;


        /**
         * Go to a certain date and update clock accordingly
         * @param date - a Moment object
         */
        this.goToDate  = function(date){
            if(!DateHelpers.isMomentValid(date)){
                throw new DateHolderException('Go to date failed. Please provide a valid Moment object.');
            }

            var oldDate = self.currentDate.clone();
            if(date !== self.currentDate){
                self.currentDate = date.clone().seconds(0);
            }
            $log.info('[DateHolder] go to date : ',self.currentDate.format(DateFormatFirebase));
            self.updateClockAfterDateChange(oldDate);

        };


        /**
         * Update the clock after changing the date
         */
        this.updateClockAfterDateChange = function(oldDate){
            var newClock = self.currentDate.clone();

            debugger;
            if(DateHelpers.isMomentValid(self.currentClock)){
                if(DateHelpers.isMomentValid(oldDate)){
                    if(self.currentClock.diff(oldDate,'day') == 1){
                        newClock.add(1, 'days');
                    }
                }
                newClock.hour(self.currentClock.hour()).minutes(self.currentClock.minutes());
            }

            self.currentClock = newClock.seconds(0);
            $log.debug('[DateHolder] clock update after date change : ',self.currentClock.format(FullDateFormat));
        };


        /**
         * Change the clock and update the date right after
         * @param clock
         */
        this.goToClock = function(clock){
            if(!DateHelpers.isMomentValid(clock)){
                throw new DateHolderException('Go to clock failed. Please provide a valid Moment object.');
            }

            var newMinutesAtInterval = DateHelpers.findClosestIntervalToDate(clock);
            if(clock !== self.currentClock){
                self.currentClock = clock.clone().seconds(0);
                if(newMinutesAtInterval){
                    self.currentClock.minutes(newMinutesAtInterval);
                }

            }
            $log.debug('[DateHolder] go to clock : ',self.currentClock.format(FullDateFormat));
            self.updateDateAfterClockChange();
        };


        /**
         * Update the date after a clock change
         */
        this.updateDateAfterClockChange = function(){
            var newDate = self.currentClock.clone();
            if(isClockBelongToPreviousDay(self.currentClock)){
                newDate.hour(0).minute(0).subtract('days',1);
            }else{
                newDate.hour(0).minute(0);
            }

            if(!self.currentDate || DateHelpers.isMomentValid(self.currentDate) && !DateHelpers.areMomentsHaveSameDates(self.currentDate, newDate)){
                self.currentDate = newDate.seconds(0);
                $log.debug('[DateHolder] date update after clock change : ',self.currentDate.format(DateFormatFirebase));

            }else{
                $log.debug('[DateHolder] date  was cancelled because of same dates ',self.currentDate.format(DateFormatFirebase));
            }
        }


        /**
         * Helpers method to check if clock is belong to previous day
         * @param clock
         * @returns {boolean}
         */
        var isClockBelongToPreviousDay = function(clock){
            if(!DateHelpers.isMomentValid(clock)){
                return false;
            }
            return (clock.hour() < 6 && clock.hour() >= 0);
        }
    });

