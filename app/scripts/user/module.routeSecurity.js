(function(angular) {
   angular.module('zedalpha.routeSecurity', [])
      .run(['$injector', '$location', '$rootScope', 'loginRedirectPath','$urlRouter', function($injector, $location, $rootScope, loginRedirectPath, $urlRouter) {
         if( $injector.has('$state') ) {
            new RouteSecurityManager($location, $rootScope, $injector.get('$state'), loginRedirectPath, $urlRouter);
         }
      }]);

   function RouteSecurityManager($location, $rootScope, $state, loginPath, $urlRouter) {
      this._state = $state;
      this._urlRouter = $urlRouter;
      this._location = $location;
      this._rootScope = $rootScope;
      this._loginPath = loginPath;
      this._redirectTo = null;
      this._authenticated = !!($rootScope.auth && $rootScope.auth.user);
      this._init();
   }

   RouteSecurityManager.prototype = {
      _init: function() {
         var self = this;
         this._checkCurrent();

         // Set up a handler for all future route changes, so we can check
         // if authentication is required.
         self._rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
            self._authRequiredRedirect(event, toState, toParams, fromState, fromParams, self._loginPath);
         });

         self._rootScope.$on('$firebaseSimpleLogin:login', angular.bind(this, this._login));
         self._rootScope.$on('$firebaseSimpleLogin:logout', angular.bind(this, this._logout));
         self._rootScope.$on('$firebaseSimpleLogin:error', angular.bind(this, this._error));
      },

      _checkCurrent: function() {
         // Check if the current page requires authentication.
         if (this._state.current && this._state.current.authRequired) {
            this._authRequiredRedirect(null, this._state.current, null,null,null, this._loginPath);
         }
      },

      _login: function() {

         this._authenticated = true;
         if( this._redirectTo ) {
            this._redirect(this._redirectTo);
            this._redirectTo = null;
         }else if(this._state.current.name == 'home'){
             this._redirect('dashboard');
         }
      },

      _logout: function() {
         this._authenticated = false;
         this._redirect('home');
      },

      _error: function() {
         if( !this._rootScope.auth || !this._rootScope.auth.user ) {
            this._authenticated = false;
         }
         this._checkCurrent();
      },

      _redirect: function(newState) {
          this._state.go(newState,null,{reload:true});
      },

      // A function to check whether the current path requires authentication,
      // and if so, whether a redirect to a login page is needed.
      _authRequiredRedirect: function(e, toState, toParams, fromState, fromParams, _loginPath) {
          if(toState.abstract) return;
         if (toState.authRequired && !this._authenticated){
            if (toState.name === undefined) {
               this._redirectTo = 'main';
            } else {
               this._redirectTo = toState.name;
            }
             if(e) e.preventDefault();
             return this._redirect(_loginPath);
         }
         else if( this._authenticated && toState && toState.name === this._loginPath ) {
             if(e) e.preventDefault();
             return this._redirect('dashboard');
         }

      }
   };
})(angular);
