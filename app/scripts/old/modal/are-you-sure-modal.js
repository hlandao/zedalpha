var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers.controller('ModalInstanceCtrl', function ($scope, $modalInstance, warningMsg) {

    $scope.warningMsg = warningMsg;

    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss();
    };
}).factory('areYouSureModalFactory', function($modal, $q){

        var factory = function(size, warningMsg){
            var modalInstance = $modal.open({
                templateUrl: '/partials/modal/are-you-sure-modal.html',
                controller: 'ModalInstanceCtrl',
                size: size,
                resolve: {
                    warningMsg: function () {
                        return warningMsg;
                    }
                }
            });

            return modalInstance;
//            modalInstance.result.then(function (selectedItem) {
//                $scope.selected = selectedItem;
//            }, function () {
//                $log.info('Modal dismissed at: ' + new Date());
//            });

        }

        return factory;

    });