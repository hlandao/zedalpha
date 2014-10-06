var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .service('UserHolder', ['$rootScope', '$q','$firebase','firebaseRef','$log', function($rootScope, $q,$firebase,firebaseRef,$log){
        var initting = $q.defer(),
            initialized = false,
            self = this;


        this.readyPromise = function(){
            return initting.promise.then(function(){
                return self.auth;
            });
        }


        $rootScope.$on('$firebaseSimpleLogin:login', function(e, user){
            $log.info('[UserHolder] : user is logged in');

            self.userProfileRef =  firebaseRef('users/' + user.uid);
            self.userProfileRef.once('value', function(snap){
                self.userProfile = snap.val();
            });
            self.auth = user;

            if(!initialized){
                initialized = true;
                initting.resolve();
            }
        });

        $rootScope.$on('$firebaseSimpleLogin:logout', function(){
            console.log('[UserHolder] : user is logged out');
            self.auth = null;
            self.userProfileRef = null;
            self.userProfile = null;

            if(!initialized){
                initialized = true;
                initting.resolve();
            }
        });

    }]);