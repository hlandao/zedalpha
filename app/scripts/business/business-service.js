var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('Business', ['$rootScope','User', '$location', function($rootScope, User, $location){
        var validate = function(newBusiness){

        };

        var create = function(newBusiness){
            validate(newBusiness);
            return User.$userProfile().$child('businesses').$add(newBusiness);
        };

        return {
            create : create
        };
    }]);