var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);
zedAlphaServices
    .factory("BusinessObject",function ($firebase) {
        return function (ref) {
            return $firebase(ref).$asObject();
        }
    })
    .factory("BusinessesCollectionGenerator",function ($firebase, UserHolder) {
           return function(){
               var ref = UserHolder.userProfileRef.child('businesses');
               return $firebase(ref).$asArray();
           }
    })
    .service("BusinessHolder", function (UserHolder, BusinessObject, $rootScope) {

        function BusinessHolderException(message) {
            this.name = 'BusinessHolderException';
            this.message= message;
        }
        BusinessHolderException.prototype = new Error();
        BusinessHolderException.prototype.constructor = BusinessHolderException;


        var self = this;
        self.init = function (businessId) {
            if (businessId) {
                if(self.business && self.business.$destroy){
                    self.business.$destroy();
                }
                var ref = UserHolder.userProfileRef.child('businesses').child(businessId);
                self.business = BusinessObject(ref)
                return self.business.$loaded();
            }else if(self.business){
                return self.business.$loaded();
            }
        };

        $rootScope.$on('$firebaseSimpleLogin:logout', function(){
           self.business = null;
        });


    });

