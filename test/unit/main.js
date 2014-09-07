'use strict';

describe('controllers', function(){
  var scope;

  beforeEach(module('zedalpha'));

  beforeEach(inject(function($rootScope) {
  	scope = $rootScope.$new();
  }));

  it('should define 3 awesome things', inject(function($controller) {
    expect(scope.awesomeThings).toBeUndefined()

    $controller('EventsCtrl', {
      $scope: scope
  	})


  }));
});
