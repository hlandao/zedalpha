var zedAlphaServices = zedAlphaServices || angular.module('zedalpha.services', []);


zedAlphaServices
    .factory("CustomerIdFromPhone", function(){
        var removeLeadingZero = function(string){
            if(string.indexOf(0) == 0){
                return string.substring(1);
            }else{
                return string;
            }
        }

        return function (phone){
            return removeLeadingZero(phone);
        }
    })
    .factory("CustomerPhoneFromId", function(){
        var addLeadingZero = function(string){
            if(string.indexOf(0) !== 0){
                return "0" + string;
            }else{
                return string;
            }
        }

        return function(id){
            return addLeadingZero(id);
        }

    })
    .factory("Customer", function(CustomerPhoneFromId,CustomerIdFromPhone){
        function Customer(data){
            angular.extend(this, data);
            return this;
        }

        Customer.prototype.$getPhoneNumber = function(){
            return CustomerPhoneFromId(this.$id);
        }

        return Customer;
    })
    .factory("CustomerFactory",function ($FirebaseObject) {
        return $FirebaseObject.$extendFactory({});
    }).factory("CustomerGeneratorRef",function ($firebase, $log, CustomerFactory) {
        return function (ref) {
            return $firebase(ref, {objectFactory : CustomerFactory}).$asObject();
        }
    }).factory("CustomerGenerator",function (CustomerGeneratorRef, firebaseRef, BusinessHolder) {
        return function (customerId) {
            var businessId = BusinessHolder.business ? BusinessHolder.business.$id : null;
            if(!businessId || !customerId) return;
            var ref = firebaseRef('customers/' + businessId + '/' + customerId);
            return CustomerGeneratorRef(ref);
        }
    }).factory('CustomersCollectionFactory', function($FirebaseArray, $q, Customer, $firebaseUtils){
        var delimeter = "|";
        var theString = delimeter;


        var $removeLeadingDelimeter =  function(string){
            if(string.indexOf(delimeter) == 0){
                return string.substring(1);
            }else{
                return string;
            }
        }


        return $FirebaseArray.$extendFactory({
            $$added : function(snap, prevChild){

                // check to make sure record does not exist
                var i = this.$indexFor(snap.name());
                if( i === -1 ) {
                    // parse data and create record
                    var rec = new Customer(snap.val());
                    if( !angular.isObject(rec) ) {
                        rec = { $value: rec };
                    }
                    rec.$id = snap.name();
                    rec.$priority = snap.getPriority();
                    $firebaseUtils.applyDefaults(rec, this.$$defaults);

                    // add it to array and send notifications
                    this._process('child_added', rec, prevChild);

                    if(rec.$id && theString.indexOf(rec.$id) == -1){
                        theString += rec.$id + delimeter;
                    }
                }
            },
            $getSuggestions : function(query){
                var self = this;
                if(query.length < 4) return [];
                var wrappedQuery = this.$removeLeadingZero(query);
                var reg = new RegExp("\\|{1}[0-9]{0,9}" + wrappedQuery + "[0-9]{0,9}", "g");
                var matches = theString.match(reg);
                var matchedCustomersArray =  _.map(matches, function(match){
                    var customerId = $removeLeadingDelimeter(match);
                    return self.$list.$getRecord(customerId);
                });

                return _.compact(matchedCustomersArray);
            },
            $removeLeadingZero : function(string){
                if(string.indexOf(0) == 0){
                    return string.substring(1);
                }else{
                    return string;
                }
            }
        });
    }).factory('CustomersCollectionGeneratorRef', function($firebase, CustomersCollectionFactory){
        return function(ref){
            return $firebase(ref, {arrayFactory: CustomersCollectionFactory}).$asArray();
        }
    }).factory('CustomersCollectionGenerator', function(CustomersCollectionGeneratorRef, firebaseRef){
        return function(businessId){
            var ref = firebaseRef('customers/' + businessId);
            return CustomersCollectionGeneratorRef(ref)
        }
    }).service('CustomersHolder', function(BusinessHolder, $rootScope, CustomersCollectionGenerator){
        var self = this;

        $rootScope.$watch(function(){
            return BusinessHolder.business && BusinessHolder.business.$id;
        }, function(newVal){
            if(self.collection && self.collection.$destroy){
                self.collection.$destroy();
            }

            if(newVal){
                CustomersCollectionGenerator(newVal).$loaded().then(function(collection){
                    console.log('collection',collection);
                    self.collection = collection
                })
            }
        })
    });



