var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives
    .directive('hlEventForm', function(EventsLogic,areYouSureModalFactory, $filter, EventsHolder,EventsDurationForGuestsHolder, FullDateFormat) {
        return {
            restrict: 'A',
            replace : true,
            priority : 10,
            scope : {
              event : "="
            },
            templateUrl : 'partials/events/event-form-directive.html',
            controller : function($scope){
               var justRevertedWhileEditing,
                   eventWatcher,
                   eventGuestsWatcher;

                var init = function(){
                    justRevertedWhileEditing = false;
                    eventWatcher = $scope.$watch('event', eventWatching,true);
                    eventGuestsWatcher = $scope.$watch('event.guests', function(newVal){
                        console.log('newVal',newVal);
                        if(newVal){
                            var newDuration = EventsDurationForGuestsHolder[newVal];
                            updateEventTimeWithNewDuration(newDuration);
                        }

                    })
                    $scope.event.helpers = $scope.event.helpers || {};
                }



               $scope.isNew = function(){
                   return !$scope.event.$id;
               }

                $scope.save = function(eventToSave){
                    var isInvalid = EventsLogic.isInvalidEventBeforeSave(eventToSave);
                    if(isInvalid && isInvalid.error){
                        var localizedError = $filter('translate')(isInvalid.error);
                        console.error('error',isInvalid.error);
                        alert(localizedError);
                    }else if(isInvalid && isInvalid.warning){
                        var modal = areYouSureModalFactory(null, 'INVALID_GUESTS_PER_15_WARNING');
                        modal.result.then(function () {
                            saveAfterValidation(eventToSave);
                        }, function () {
                            console.debug('Modal dismissed at: ' + new Date());
                        });
                    }else{
                        saveAfterValidation(eventToSave);
                    }
                };



                var saveAfterValidation = function(eventToSave){
                    if(angular.isFunction(eventWatcher)) eventWatcher();
                    var cloned = angular.copy(eventToSave);
                    if(eventToSave.$id){
                        delete cloned.helpers;
                        var $event = EventsHolder.$allEvents.$child(eventToSave.$id);
                        $event.$set(cloned);
                        delete eventToSave.helpers;
                    }else{
                        delete cloned.helpers;
                        EventsHolder.$allEvents.$add(cloned);
                        delete eventToSave.helpers;
                    }
                }




                $scope.close = function(event){
                    if(!event) return false;
                    delete event.helpers;
                };


                var eventWatching = function(newVal, oldVal){
                    if(justRevertedWhileEditing){
                        justRevertedWhileEditing = false;
                        return;
                    }
                    if(newVal){
                        var isInvalid = EventsLogic.isInvalidEventWhileEdit(newVal);
                        if(isInvalid && isInvalid.error){
                            console.error('[EventsCtrl]: error while edit event', isInvalid.error);
                            var localizedError = $filter('translate')(isInvalid.error);
                            alert(localizedError);
                            justRevertedWhileEditing = true;
                            newVal.startTime =  oldVal.startTime;
                            newVal.endTime =  oldVal.endTime;
                            newVal.seats =  oldVal.seats;
                        }
                    }
                };

                $scope.remove = function(event){
                    if(!event || !event.$id) return false;
                    var modal = areYouSureModalFactory(null, 'REMOVE_EVENT_WARNING');
                    modal.result.then(function () {
                        EventsHolder.$allEvents.$remove(event.$id);
                        delete event.helpers;
                    }, function () {
                        console.debug('Modal dismissed at: ' + new Date());
                    });

                }


                var updateEventTimeWithNewDuration = function(newDuration){
                    if (newDuration && $scope.event.startTime){
                        var startTimeMoment = moment($scope.event.startTime);
                        var newEndTimeMoment = startTimeMoment.add(parseInt(newDuration), 'minutes');
                        $scope.event.endTime = new Date(newEndTimeMoment.format(FullDateFormat));

                    }
                }


                $scope.$on('$destroy', function(){
                    eventWatcher();
                    eventGuestsWatcher();
                });


                init();


            }
        };
    });