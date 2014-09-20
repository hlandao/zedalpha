//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('SeatingOptionsCtrl', function($scope,BusinessMetaData, BusinessHolder, $firebase, firebaseRef, UserHolder){

        var ref = UserHolder.userProfileRef.child('businesses/' + BusinessHolder.business.$id + '/seatingOptions');
        $scope.seatingOptions = $firebase(ref).$asArray();


        $scope.add = function(){
            if(!$scope.newOption){
                toastr.options = {
                    "closeButton": true,
                    "positionClass": "toast-bottom-right",
                    "timeOut": "3000"
                };
                return toastr.error("Please enter an option!")
            }else{

                $scope.seatingOptions.$add({
                    option : $scope.newOption
                }).then(function(){
                    $scope.newOption = "";
                    toastr.options = {
                        "closeButton": true,
                        "positionClass": "toast-bottom-right",
                        "timeOut": "3000"
                    };
                    return toastr.success("New seating options was added!")

                }, function(){
                    $scope.newOption = "";
                    toastr.options = {
                        "closeButton": true,
                        "positionClass": "toast-bottom-right",
                        "timeOut": "3000"
                    };
                    return toastr.error("Error adding new seating option!")

                });

            }



        };

        $scope.remove = function(element){

            $scope.seatingOptions.$remove(element).then(function(){
                toastr.options = {
                    "closeButton": true,
                    "positionClass": "toast-bottom-right",
                    "timeOut": "3000"
                };
                return toastr.success("Option was removed!")

            }, function(){
                toastr.options = {
                    "closeButton": true,
                    "positionClass": "toast-bottom-right",
                    "timeOut": "3000"
                };
                return toastr.error("Error removing status!")

            });

        };

    });