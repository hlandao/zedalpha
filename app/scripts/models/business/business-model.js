var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);
zedAlphaServices
    .factory('Business', function($FirebaseObject){
        function Business(firebase, destroyFunction, readyPromise){
            $FirebaseObject.call(this, firebase, destroyFunction, readyPromise);
        }
        return Business;
    })
    .factory("BusinessFactory",function ($FirebaseObject, Business) {
        return $FirebaseObject.$extendFactory(Business);
    }).factory("BusinessObject",function ($firebase, BusinessFactory) {
        return function (ref) {
            return $firebase(ref, {objectFactory: BusinessFactory}).$asObject();
        }
    })
    .service("BusinessesCollection",function ($firebase, UserHolder) {
        var self = this;
        this.readyPromise = UserHolder.readyPromise().then(function(){
            var ref = UserHolder.userProfileRef.child('businesses');
            self.collection = $firebase(ref).$asArray();
            return self.collection.$loaded();
        });
    })
    .service("BusinessHolder", function (UserHolder, BusinessObject, $rootScope) {
        var self = this;
        self.init = function (businessId) {
            if (businessId) {
                var ref = UserHolder.userProfileRef.child('businesses').child(businessId);
                self.business = BusinessObject(ref)
                return self.business.$loaded();
            }else{
                return self.business && self.business.$loaded()
            }
        };

        $rootScope.$on('$businessHolderChanged', self.init);
    });

