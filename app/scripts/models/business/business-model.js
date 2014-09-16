var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);
zedAlphaServices
    .factory("BusinessObject",function ($firebase) {
        return function (ref) {
            return $firebase(ref).$asObject();
        }
    })
    .service("BusinessesCollection",function ($firebase, UserHolder, $q, $rootScope) {
        var self = this;
        this.init = function(){

            return UserHolder.readyPromise().then(function(){
                if(!UserHolder.userProfileRef) return $q.reject('No user');
                var ref = UserHolder.userProfileRef.child('businesses');
                self.collection = $firebase(ref).$asArray();
                return self.collection.$loaded();
            });
        }

        $rootScope.$on('$firebaseSimpleLogin:logout', function(){
            self.collection = null;
        });

        $rootScope.$on('$firebaseSimpleLogin:login', function(){
            self.collection = null;
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
                return self.business && self.business.$loaded().then(function(business){
                    $rootScope.$emit('$businessHolderChanged');
                    return business;
                })
            }
        };

        $rootScope.$on('$firebaseSimpleLogin:logout', function(){
           self.business = null;
        });


    });

