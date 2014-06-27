var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('BusinessHolder', function(){
        var _businessHolder = {business : null};
        return _businessHolder;
    })
    .factory('Business', ['$rootScope','$q','User', '$location','BusinessHolder', function($rootScope,$q, User, $location,BusinessHolder){
        var validate = function(newBusiness){

        };

        var create = function(newBusiness){
            validate(newBusiness);
            return User.$userProfile().$child('businesses').$add(newBusiness);
        };

        var getBusinessWithId = function(id){
            var defer = $q.defer();
            BusinessHolder.business = null;
            BusinessHolder.ready = defer.promise;
            BusinessHolder.business = User.$userProfile().$child('businesses').$child(id).$on('loaded', function(){
                BusinessHolder.business.$off('loaded');
                defer.resolve(BusinessHolder.business);
            });
            return defer.promise;
        }


        return {
            create : create,
            getBusinessWithId : getBusinessWithId
        };
    }]).factory('BusinessMetaData', ['$firebase', 'firebaseRef', function($firebase, firebaseRef){
        return $firebase(firebaseRef('businessMetaData'));
    }]);