var __CONFIG__ = {
    firebase_url : "https://zedbeta.firebaseio.com"
};

$.ajax({
    url:    '/scripts/config.json',
    success: function(result) {
        __CONFIG__ = result;
    },
    async:   false
});
angular.element(document).ready(function() {
    angular.bootstrap(document,['zedalpha']);
});