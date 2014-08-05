var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .service('Localizer', function($translate, cssInjector, $rootScope, $q, $timeout) {
        var localStorageKey = 'LOCALE';
        var defaultLanguage = 'he';
        var language = defaultLanguage;
        var defer = $q.defer();
        this.initting = defer.promise;
        var self = this;

        this.init = function(){
            var lang = localStorage.getItem('localStorageKey') || defaultLanguage;
            self.setLocale(lang);
            $timeout(function(){
                defer.resolve();
            });
        };

        this.setLocale = function(langKey) {
            var isRTL;
            if (langKey === 'he'){
                isRTL = true;
                $('body').addClass('rtl');
            } else if (langKey === 'en'){
                isRTL = false;
                $('body').removeClass('rtl');
            }

            localStorage.setItem(localStorageKey, langKey);


            setRTLDirection(isRTL);
            setLanguage(langKey);
            $rootScope.$broadcast('$localeStateChanged');
        }

        function setRTLDirection(isRTL) {
            if (isRTL) {
                cssInjector.add("/vendor/bootstrap-rtl/bootstrap-rtl.css");
                $('body').addClass('rtl');
            }
            else {
                $('body').removeClass('rtl');
                cssInjector.removeAll();
            }
        }

        function setLanguage(langKey) {
            $translate.use(langKey);
        }

    });