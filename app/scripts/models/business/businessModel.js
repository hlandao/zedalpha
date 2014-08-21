var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('Business', function($firebaseObject){
        function Business(firebase, destroyFunction, readyPromise){
            $firebaseObject.call(this, $firebase, destroyFunction, readyPromise);
        }

        return Business;
    })
    .factory("BusinessFactory",function ($FirebaseObject, Business) {
        return $FirebaseObject.$extendFactory(Business);
    }).factory("BusinessObject",function ($firebase, BusinessFactory) {
        return function (ref) {
            return $firebase(ref, {objectFactory: BusinessFactory}).$asObject();
        }
    }).service("BusinessHolder", function (UserHolder, BusinessObject, UserHolder) {
        this.init = function (businessId) {
            if (businessId) {
                var ref = UserHolder.userProfileRef.child('businesses').child(businessId);
                this.business = BusinessObject(businessId)
                return this.business.$loaded();
            }
        };

        $rootScope.$on('$businessHolderChanged', updateObject);
        updateObject();
    });



