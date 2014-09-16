//'use strict';

// Declare app level module which depends on filters, and services
var zedAlphaConfigModule = zedAlphaConfigModule || angular.module('zedalpha.config', []);

    zedAlphaConfigModule
    // version of this seed app is compatible with angularFire 0.6
    // see tags for other versions: https://github.com/firebase/angularFire-seed/tags
    .constant('version', '0.6')

    // where to redirect users if they need to authenticate (see module.routeSecurity)
    .constant('loginRedirectPath', 'home')

    // your Firebase URL goes here
    .constant('FBURL', __CONFIG__.firebase_url)

    // Loggly key
    .constant('LOGGLY_KEY', '7bec49fa-7dc7-45a5-b7fb-d5137c2cca9a')


//you can use this one to try out a demo of the seed
//   .constant('FBURL', 'https://angularfire-seed.firebaseio.com');


/*********************
 * !!FOR E2E TESTING!!
 *
 * Must enable email/password logins and manually create
 * the test user before the e2e tests will pass
 *
 * user: test@test.com
 * pass: test123
 */
