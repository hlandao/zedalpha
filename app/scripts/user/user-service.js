var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('UserHolder', ['$rootScope', function($rootScope){
        $rootScope.$on('$firebaseSimpleLogin:login', function(e, user){
            console.log(user);
            _userHolder.auth = user;
        });
        $rootScope.$on('$firebaseSimpleLogin:logout', function(){
            _userHolder.auth = null;
        });

        var _userHolder = {
            auth : null
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

