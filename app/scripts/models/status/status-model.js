var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .value('StatusFilters', ['ALL','SEATED','ORDERED','OCCASIONAL'])
    .value('NotCollidingEventStatuses', ['NO_SHOW', 'FINISHED', 'CANCELED','REMOVED'])
    .value('DeadEventsStatuses',['FINISHED','NO_SHOW','CANCELED','REMOVED'])
    .value('STATUS_FILTERS_TO_FILTER', {
        ALL : ['ALL'],
        SEATED : ['SEATED', 'CHEQUE', ''],
        ORDERED : ['ORDERED', 'CONFIRMED'],
        OCCASIONAL : ['OCCASIONAL']
    })
    .value('REMOVED_STATUS', {status : 'REMOVED', color : '#f00'})
    .filter('colorForStatus', function(BusinessHolder){
        return function(status){
            if(!status) return false;
            var output = _.findWhere(BusinessHolder.business.eventsStatuses, {status : status});
            if(output) return output.color;
        }
    });



