//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('BusinessCtrl', function($scope, BusinessHolder ,BusinessMetaData, $state, BusinessesCollection){
        // get business meta data
        $scope.businessMetaData = BusinessMetaData;
        // get business data from business holder
        $scope.business = BusinessHolder.business;

        $scope.create = function(newBusiness){
            newBusiness.eventsStatuses = BusinessMetaData.eventsStatuses || null;
            BusinessesCollection.collection.$add(newBusiness).then(function(ref){
                $state.go('business.show', {businessId : ref.name()});
            }, function(){

            });
        };
    });