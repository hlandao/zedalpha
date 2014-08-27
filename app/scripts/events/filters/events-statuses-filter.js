var zedAlphaFilters = zedAlphaFilters || angular.module('zedalpha.filters', []);


zedAlphaFilters
    .filter('statusesFilter', function ($filter) {
        var deadEventsStatuses = ['FINISHED','NO_SHOW','CANCELED'];
        return function (eventsArr, selectedStatus) {
            if (selectedStatus == 'ALL') {
                return  $filter('filter')(eventsArr, function(event){
                    return  (event.status && !~deadEventsStatuses.indexOf(event.status.status));
                });

            }else if(selectedStatus == 'DEAD'){
                return  $filter('filter')(eventsArr, function(event){
                    return  (event.status && ~deadEventsStatuses.indexOf(event.status.status));
                });

            }
            return  $filter('filter')(eventsArr, function(event){
               return  event.status && event.status.status == selectedStatus;
            });
        }
    });