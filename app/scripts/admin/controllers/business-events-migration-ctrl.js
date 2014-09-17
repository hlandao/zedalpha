(function(a){var b=Object.keys||function(a){var b=[];for(var c in a)a.hasOwnProperty(c)&&b.push(c);return b};var c=function(a,b){var c=Array.prototype[a];return function(d,e,f){var g=d?d[a]:0;return g&&g===c?g.call(d,e,f):b(d,e,f)}};var d=c("forEach",function(a,c){var d=a instanceof Object;var e=d?b(a):a||[];for(var f=0,g=e.length;f<g;f++){var h=d?e[f]:f;c(a[h],h,a)}});var e=function(a,c,e){var f=a.length||b(a).length;if(!f)return e();var g=0;d(a,function(){var a=function(a){a?(e(a),e=function(){}):++g===f&&e()};var b=Array.prototype.slice.call(arguments);c.length?(b=b.slice(0,c.length-1),b[c.length-1]=a):b.push(a),c.apply(this,b)})};var f=function(a,c,d){var e=b(a);if(!e.length)return d();var f=0;var g=function(){var b=e[f];var h=[a[b],b,a].slice(0,c.length-1);h[c.length-1]=function(a){a?(d(a),d=function(){}):++f===e.length?d():g()},c.apply(this,h)};g()};var g=c("map",function(a,b){var c=[];d(a,function(a,d,e){c[c.length]=b(a,d,e)});return c});var h=function(a){return function(b,c,d){var e=[];a(b,function(a,b,d,f){var g=function(a,b){e[e.length]=b,f(a)};var h=[a,b,d];c.length?(h=h.slice(0,c.length-1),h[c.length-1]=g):h.push(g),c.apply(this,h)},function(a){d(a,e)})}};var i=c("filter",function(a,b,c){var e=[];d(a,function(a,c,d){b(a,c,d)&&(e[e.length]=a)});return e});var j=function(a,b,c){var d=[];e(a,function(a,c,e,f){var g=function(b,c){c&&(d[d.length]=a),f(b)};var h=[a,c,e];b.length?(h=h.slice(0,b.length-1),h[b.length-1]=g):h.push(g),b.apply(this,h)},function(a){c(a,d)})};var k=c("reduce",function(a,b,c){d(a,function(a,d,e){c=b(c,a,d,e)});return c});var l=function(a,b,c,d){f(a,function(a,d,e,f){var g=function(a,b){c=b,f(a)};var h=[c,a,d,e];b.length?(h=h.slice(0,b.length-1),h[b.length-1]=g):h.push(g),b.apply(this,h)},function(a){d(a,c)})};a.each=function(a,b,c){return(c?e:d)(a,b,c)},a.map=function(a,b,c){return(c?h(e):g)(a,b,c)},a.filter=function(a,b,c){return(c?j:i)(a,b,c)},a.reduce=function(a,b,c,d){return(d?l:k)(a,b,c,d)},a.parallel=function(a,b){var c=new a.constructor;e(a,function(a,b,d){a(function(a){var e=Array.prototype.slice.call(arguments,1);c[b]=e.length<=1?e[0]:e,d(a)})},function(a){(b||function(){})(a,c)})},a.series=function(a,b){var c=new a.constructor;f(a,function(a,b,d){a(function(a,e){var f=Array.prototype.slice.call(arguments,1);c[b]=f.length<=1?f[0]:f,d(a)})},function(a){(b||function(){})(a,c)})}})(typeof exports==="undefined"?this._=this._||{}:exports)
//'use strict';

/* Controllers */
var zedAlphaControllers = zedAlphaControllers || angular.module('zedalpha.controllers', []);

zedAlphaControllers
    .controller('EventsMigrationCtrl', function($scope, BusinessHolder, EventsCollection, Firebase, $firebase, DateFormatFirebase, Event, areYouSureModalFactory){

        $scope.business = BusinessHolder.business;


        var zedAlphaFBURL = "https://zed2alpha.firebaseio.com";
        var oldUsersRef = new Firebase(zedAlphaFBURL + '/users');
        $scope.oldUsersCollection = $firebase(oldUsersRef).$asArray();

        $scope.isWorking = false;
        $scope.copy = function(){
            if($scope.isWorking){
                return;
            }
            $scope.isWorking = 1;

            areYouSureModalFactory(null, 'Are you sure you want to copy event from ' + $scope.selectedBusiness.name + ' to ' + BusinessHolder.business.name + ' ?').result.then(function(){
                var events = $scope.selectedBusiness.events;
                $scope.isWorking = eventsSize(events);
                $scope.nowInWork = 0;
                $scope.log = [];
                $scope.summary = {ok : 0, error : 0};
                $scope.done = false;

                _.each(events, function (event, callback) {

                        var newEvent = transformEvent(event);
                        EventsCollection.saveWithValidation(newEvent, true).then(function(){
                            ++$scope.summary.ok;
                            callback();
                        }, function(err){
                            ++$scope.summary.error;
                            console.error(err);
                            $scope.log.push({
                                eventString : eventStringForLog(newEvent),
                                result : 'Error',
                                error : err
                            });
                            callback();
                        }).finally(function(){
                            ++$scope.nowInWork;
                        });
                    },
                    function (err, result) {
                        if(err){
                            console.error(err);
                        }

                        $scope.done = true;
                        $scope.isWorking = false;
                    });

            }, function(){
                $scope.isWorking = false;
                alert('Canceled!');
            })

        }

        $scope.reset = function(){
            EventsCollection.resetEventsForBusiness().then(function(){
                alert('Success!');
            }, function(){
                alert('Canceled!');
            });
        }

        var eventStringForLog = function(event){
            return event.data.baseDate + ", " + event.data.name;
        }

        var eventsSize = function(events){
            var size = 0, key;
            for (key in events) {
                if (events.hasOwnProperty(key)) size++;
            }
            return size;
        }

        var transformEvent = function(event){
            var data = angular.extend({}, event);
            data.status = event.status.status;
            var startTime = moment(event.startTime);
            var endTime = moment(event.endTime);
            data.startTime = startTime.clone();
            data.endTime = endTime.clone();

            if(startTime.hour() < 6){
                startTime.subtract(1, 'days');
            }
            data.baseDate = startTime.format(DateFormatFirebase);

            var newEvent = new Event(null, null, data);
            return newEvent;
        }


    });