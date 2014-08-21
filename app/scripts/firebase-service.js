
var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);
zedAlphaServices
// a simple utility to create references to Firebase paths
    .factory('firebaseRef', ['Firebase', 'FBURL', function(Firebase, FBURL) {
        /**
         * @function
         * @name firebaseRef
         * @param {String|Array...} path
         * @return a Firebase instance
         */
        return function(path) {
            return new Firebase(pathRef([FBURL].concat(Array.prototype.slice.call(arguments))));
        }
    }]);

function pathRef(args) {
    for(var i=0; i < args.length; i++) {
        if( typeof(args[i]) === 'object' ) {
            args[i] = pathRef(args[i]);
        }
    }
    return args.join('/');
}