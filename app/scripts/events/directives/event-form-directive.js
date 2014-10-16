var zedAlphaDirectives = zedAlphaDirectives || angular.module('zedalpha.directives', []);


zedAlphaDirectives
    .directive('hlEventForm', function(EventsCollection,areYouSureModalFactory, $filter, FullDateFormat, $q, $log, ShiftsDayHolder, BusinessHolder) {
        return {
            restrict: 'A',
            replace : true,
            priority : 10,
            require : ['hlEventForm'],
            scope : {
              onClose  : "&onClose",
              event : "=hlEventForm"
            },
            templateUrl : '/partials/events/event-form-directive.html',
            controller :  function HlEventFormController($scope){
               var eventDataClone;

                $scope.business = BusinessHolder.business;

                var requiredInputsForDest = {
                        name : true,
                        phone : true,
                        hostess : true,
                        seats : true
                    },
                    requiredInputsForOccasional = {
                        name : true,
                        phone : false,
                        hostess : false,
                        seats : true
                    },
                    isSaving = false;

                this.event = $scope.event;
                this.init = function(){
                    eventDataClone = angular.copy($scope.event.data);
                    if($scope.event.data.isOccasional){
                        $scope.requiredInputs = requiredInputsForOccasional;
                    }else{
                        $scope.requiredInputs = requiredInputsForDest;
                    }

                }


               var revertEventToOriginal = function(){
                  angular.extend($scope.event.data,eventDataClone);
               }


                $scope.$isNew = function(){
                   return $scope.event.$isNew();
               }


                var showSaveSuccessAlert = function(){
                    toastr.options = {
                        "closeButton": true,
                        "positionClass": "toast-bottom-right",
                        "timeOut": "3000"
                    };
                    var localizedMessage = $filter('translate')('SUCCESS_SAVE_EVENT');

                    toastr.success(localizedMessage);
                }


                $scope.save = function(){
                    if(isSaving){
                        return;
                    }


                    EventsCollection.saveWithValidation($scope.event, false, $scope.seatingOptions).then(function(output){
                        if((output && output.warnings && output.warnings.length)){
                            var promises = [], i;

                            if(output && output.warnings && output.warnings.length){
                                for (i = 0; i < output.warnings.length; ++i){
                                    promises.push(areYouSureModalFactory(null, output.warnings[i].warning, null, output.warnings[i].extra).result);
                                }
                            }

                            return $q.all(promises).then(function(){
                                return EventsCollection.saveWithValidation($scope.event, true).then(function(){
                                    showSaveSuccessAlert();
                                    $scope.closeLinkFN(true);
                                }, function(error){
                                    return $q.reject('ERROR_EVENT_SAVING');
                                });


                            }, function(){
                                isSaving = false;
                            });
                        }else{
                            showSaveSuccessAlert();
                            $scope.closeLinkFN(true);
                        }


                    }).catch(function(error){
                        isSaving = false;
                        if(error && error.error){
                            var localizedError = $filter('translate')(error.error);
                            $log.error('[EventForm] error saving event',error);
                            areYouSureModalFactory(null, localizedError, {ok : true, cancel : false}, {event : error.withEvent});
                        }else{
                            var localizedError = $filter('translate')('ERROR_EVENT_SAVING');
                            $log.error('[EventForm] error saving event');
                            areYouSureModalFactory(null, localizedError, {ok : true, cancel : false});
                        }
                    });

                };

                $scope.close = function(event){
                    if($scope.event.$id) revertEventToOriginal();
                    $scope.closeLinkFN();
                };

                $scope.remove = function(event){
                    var modal = areYouSureModalFactory(null, 'REMOVE_EVENT_WARNING');
                    modal.result.then(function () {
                        EventsCollection.remove($scope.event).then(function(){
                            $scope.closeLinkFN();
                        }).catch(function(error){
                            var localizedError = $filter('translate')('ERROR_EVENT_REMOVE');
                            $log.error('[EventForm] error remove event');
                            areYouSureModalFactory(null, localizedError, {ok : true, cancel : false});
                        });
                    });

                }


                $scope.$on('$destroy', function(){
                    $scope.event && $scope.event.$exitEditingMode && $scope.event.$exitEditingMode();
                });

            },
            link : function(scope, element, attrs,ctrls){
                var ctrl = ctrls[0];
                ctrl.init();
                element.find('.phone-input').eq(0).focus();

                scope.closeLinkFN =  function(result){
                    scope.onClose({$result : result})
                }
            }
        };
    });