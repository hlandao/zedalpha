//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('BusinessCtrl', function($scope, BusinessHolder ,BusinessMetaData, $state, BusinessesCollectionGenerator){
        // get business meta data
        $scope.businessMetaData = BusinessMetaData;
        // get business data from business holder
        $scope.business = BusinessHolder.business;

        var businessesCollection = BusinessesCollectionGenerator();
        $scope.create = function(newBusiness){
            newBusiness.eventsStatuses = BusinessMetaData.eventsStatuses || null;
            businessesCollection.$add(newBusiness).then(function(ref){
                $state.go('business.show', {businessId : ref.name()});
            }, function(){

            });
        };
    });