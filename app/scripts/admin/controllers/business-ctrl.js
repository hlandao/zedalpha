//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('BusinessCtrl', function($log, $scope, BusinessHolder ,BusinessMetaData, $state, BusinessesCollectionGenerator,firebaseRef, UserHolder){
        // get business meta data
        $scope.businessMetaData = BusinessMetaData;
        // get business data from business holder
        $scope.business = BusinessHolder.business;

        var $businessIndexRef = firebaseRef('businessIndex');

        var businessesCollection = BusinessesCollectionGenerator();
        $scope.create = function(newBusiness){
            newBusiness.eventsStatuses = BusinessMetaData.eventsStatuses || null;
            businessesCollection.$add(newBusiness).then(function(ref){
                return $businessIndexRef.$set(ref.name(), UserHolder.auth.uid).then(function(){
                    $state.go('business.show', {businessId : ref.name()});
                });

            }).catch(function(error){
                $log.error('Could not add new business.Error : ',error);
                alert("Could not add new business");
            });
        };
    });