var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('UserHolder', ['$rootScope', '$q', function($rootScope, $q){
        var initting = $q.defer();

        $rootScope.$on('$firebaseSimpleLogin:login', function(e, user){
            _userHolder.auth = user;
            initting.resolve(_userHolder);
        });
        $rootScope.$on('$firebaseSimpleLogin:logout', function(){
            _userHolder.auth = null;
            initting.resolve(_userHolder);
        });

        var _userHolder = {
            auth : null,
            ready : function(){
                return initting.promise
            }
        };

        return _userHolder;
    }])
    .factory('User',['$rootScope', 'UserHolder', 'firebaseRef', '$firebase', function($rootScope, UserHolder, firebaseRef, $firebase){

        var _$userProfile;
        var _userProfileRef;
        var $userProfile = function(){
            if(_$userProfile) return _$userProfile;
            _userProfileRef = _userProfileRef || firebaseRef('users/' + UserHolder.auth.uid);
            return $firebase(_userProfileRef);
        }

        return {
            $userProfile : $userProfile
        }
    }]);

