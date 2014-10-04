var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers.controller('ModalInstanceCtrl', function ($scope, $modalInstance, warningMsg,buttons,extraDetails) {

    $scope.warningMsg = warningMsg;
    $scope.buttons = buttons;
    $scope.extraDetails = extraDetails;

    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss();
    };
}).factory('areYouSureModalFactory', function($modal, $q){

        var factory = function(size, warningMsg, buttons, extraDetails){
            buttons = angular.extend({
                ok : true,
                cancel : true
            }, buttons);
            var modalInstance = $modal.open({
                templateUrl: '/partials/modal/are-you-sure-modal.html',
                controller: 'ModalInstanceCtrl',
                size: size,
                resolve: {
                    warningMsg: function () {
                        return warningMsg;
                    },
                    buttons : function(){
                        return buttons;
                    },
                    extraDetails : function(){
                        return extraDetails;
                    }
                }
            });

            return modalInstance;
        }

        return factory;

    });