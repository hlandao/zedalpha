var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('UserHolder', ['$rootScope', '$q','$firebase','firebaseRef','$log', function($rootScope, $q,$firebase,firebaseRef,$log){
        var initting = $q.defer();
        var initialized = false;
        $rootScope.$on('$firebaseSimpleLogin:login', function(e, user){
            $log.debug('[UserHolder] : user is logged in');

            _userHolder.userProfileRef =  firebaseRef('users/' + user.uid);
            _userHolder.$userProfile =  $firebase(_userHolder.userProfileRef);
            _userHolder.auth = user;


            if(!initialized){
                initialized = true;
                initting.resolve(_userHolder);
            }

        });
        $rootScope.$on('$firebaseSimpleLogin:logout', function(){
            $log.debug('[UserHolder] : user is logged out');
            _userHolder.auth = null;
            _userHolder.userProfileRef = null;
            _userHolder.$userProfile = null;
            if(!initialized){
                initialized = true;
                initting.resolve(_userHolder);
            }
        });

        var _userHolder = {
            promise : function(){
                return initting.promise
            }
        };

        return _userHolder;
    }]);