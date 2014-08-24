var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory('BusinessMetaData', ['$firebase', 'firebaseRef', function($firebase, firebaseRef){
    return $firebase(firebaseRef('businessMetaData')).$asObject();
}]);