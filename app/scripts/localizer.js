var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .service('Localizer', function($translate, cssInjector, $rootScope) {

        var defaultLanguage = 'he';
        var language = defaultLanguage;

        this.setLocale = function(langKey) {
            var isRTL;
            if (langKey === 'he')
                isRTL = true;
            else if (langKey === 'en')
                isRTL = false;

            setRTLDirection(isRTL);
            setLanguage(langKey);
            $rootScope.$broadcast('$localeStateChanged');
        }

        function setRTLDirection(isRTL) {
            if (isRTL) {
                cssInjector.add("/styles/vendor/bootstrap-rtl/bootstrap-rtl.css");
            }
            else {
                cssInjector.removeAll();
            }
        }

        function setLanguage(langKey) {
            $translate.use(langKey);
        }

    });