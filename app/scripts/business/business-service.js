var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('BusinessHolder', function($rootScope, $q, Business, $q){
        var _oldBusinessId;
        var _businessHolder = {
            init : function(businessId){
                var defer = $q.defer();
                if(businessId && (businessId != _oldBusinessId || !_businessHolder.$business)){
                    Business.getBusinessWithId(businessId).then(function($business){
                        _businessHolder.$business = $business;
                        _businessHolder.businessId = businessId;
                        defer.resolve(_businessHolder);
                        _oldBusinessId = businessId;
                    });
                }else if(!businessId){
                    _businessHolder.$business = null;
                    _businessHolder.businessId = null;
                    defer.resolve();
                }else{
                    defer.resolve(_businessHolder)
                }

                return defer.promise;
            }
        };


        return _businessHolder;
    })
    .factory('Business', ['$rootScope','$q','UserHolder', '$location', function($rootScope,$q, UserHolder, $location){
        var validate = function(newBusiness){

        };

        var create = function(newBusiness){
            validate(newBusiness);
            return UserHolder.$userProfile.$child('businesses').$add(newBusiness);
        };

        var getBusinessWithId = function(id){
            var defer = $q.defer();
             var $business = UserHolder.$userProfile.$child('businesses').$child(id).$on('loaded', function(){
                 $business.$off('loaded');
                defer.resolve($business);
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