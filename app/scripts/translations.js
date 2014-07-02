var zedAlphaConfigModule = zedAlphaConfigModule || angular.module('zedalpha.config', []);

zedAlphaConfigModule
    .config(function ($translateProvider) {
    $translateProvider.translations('en', {
        // HOME
        EMAIL_ADDRESS: 'Email Address',
        PASSWORD: 'Password',
        CONFIRM_PASSWORD: 'Confirm Password',
        DONE_HAVE_ACCOUNT_LABEL: 'Don\'t have an account ? click here',
        REGISTER_ACCOUNT_LABEL: 'Register New Account',
        REGISTER: 'Register',
        ALREADY_REGISTERED_LABEL: 'Already registered ? click here',
        // DASHBOARD
        YOUR_BUSINESSES: 'Your Businesses',
        ADD_NEW_BUSINESS: 'Add New Business',
        // Business
        ADD_NEW_BUSINESS_LABEL : "Add New Business",
        BUSINESS_NAME: "Business Name",
        BUSINESS_TYPE: 'Business Type',
        BUSINESS_AREA: 'Area',
        BUSINESS_SIZE: 'Business Size',
        // GENERAL
        CREATE: 'Create',
        // EVENTS
        STATUS: 'Status',
        NAME: 'Name',
        GUESTS: 'Guests',
        SEATS: 'Seats',
        TIME: 'Time',
        PHONE: 'Phone',
        EMAIL: 'Email',
        CONTACT_PERSON: 'Contact',
        CONTACT_COMMENT: 'Contact Comment',
        COMMENT: 'Comment',
        HOSTESS: 'Hostess',
        EVENT_DURATION: 'Duration',
        BACK: 'Back',
        DELETE: 'Delete',
        SAVE : 'Save',
        OCCASIONAL : 'Walkin',
        ALL: "All",
        SEATING: "Seating",
        ORDERED: "Orderd",
        // ERRORS
        ERROR_MSG_COLLISION: "Error : event collide with another event",
        // TOP NAV BAR
        TOTAL_ORDERS: "Total Orders",
        TOTAL_GUESTS: "Total Gusets",
        GUESTS_LEFT: "Gusets Left",
        TOTAL_WALKINS: "Total Walkins"

    });
    $translateProvider.preferredLanguage('en');
});