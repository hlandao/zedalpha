'use strict';


describe('UNIT::EventsCtrl', function () {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
    var scope, userHolderValue, _EventsCollection_, _EventsCollectionGenerator_;

    beforeEach(module('zedalpha'));

    beforeEach(module('mock.utils'));

    beforeEach(module('mock.firebase'));


    beforeEach(module(function ($provide) {
        $provide.value('BusinessHolder', {
            business: {
                $id : '-JW58t3i2htvGUoTxbPo',
                eventsDurationForGuests : {
                    default : 120
                }
            }
        });
    }));


    beforeEach(inject(function ($rootScope, DateHolder, EventsCollection, EventsCollectionGenerator) {
        scope = $rootScope.$new();
        _EventsCollection_ = EventsCollection;
        _EventsCollectionGenerator_ = EventsCollectionGenerator;
    }));






    it('test1', function(){
        inject(function ($controller) {
            $controller('EventsCtrl', {
                $scope: scope
            });

            var fb = new MockFirebase("Mock://");
            fb.autoFlush();
            var EC = _EventsCollectionGenerator_(fb);
            var spy = jasmine.createSpy('resolve');
            EC.$add({foo: 'bar'}).then(spy, spy);
            fb.flush();
            var lastId = fb.getLastAutoId();
            console.log('lastId',lastId)
            expect(spy).toHaveBeenCalledWith(fb.child(lastId));
        })
    });




});
