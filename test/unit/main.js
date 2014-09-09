'use strict';

describe('UNIT::EventsCtrl', function () {
    var scope, userHolderValue, _EventsCollection;
    MockFirebase.override();

    beforeEach(module('zedalpha'));

    beforeEach(module(function ($provide) {
        $provide.value('UserHolder', {
            userProfileRef: new Firebase('https://mock.firebaseio.com/users/mock_user_id')
        });
    }));

    beforeEach(module(function ($provide) {
        $provide.value('BusinessHolder', {
            business: {
                $id : 'FAKE_BUSINESS_ID',
                eventsDurationForGuests : {
                    default : 120
                }
            }
        });
    }));


    beforeEach(inject(function ($rootScope, DateHolder, EventsCollection) {
        scope = $rootScope.$new();
        _EventsCollection = EventsCollection;
    }));

    beforeEach(function (done) {
        var promise = _EventsCollection.updateEvents();
        promise.then(function(){
            console.log('success');
            done();
        }).catch(function(){
            console.log('ERROR');
        });
    });





    it('should have a valid business, date & clock', inject(function ($controller) {
        $controller('EventsCtrl', {
            $scope: scope
        });
        expect(scope.business).toBeDefined();
        expect(scope.DateHolder.currentDate.isValid()).toBe(true);
        expect(scope.DateHolder.currentClock.isValid()).toBe(true);
    }));

    it('should create a new event', inject(function ($controller, Event, EventsCollection,DateHolder, BusinessHolder) {
        $controller('EventsCtrl', {
            $scope: scope
        });
        console.log('EventsCollection.collection',EventsCollection.collection);
//        scope.newEventWithSeatsDic('destination', null, null);
//        expect(scope.newEvent).toEqual(jasmine.any(Event));
    }));




});
