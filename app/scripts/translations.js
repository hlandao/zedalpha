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
        SEATED: "Seating",
        CONFIRMED: "Confirmed",
        CHEQUE: "Cheque",
        FINISHED: "Finished",
        NO_SHOW: "No Show",


        ORDERED: "Orderd",
        // ERRORS
        ERROR_MSG_COLLISION: "Error : event collide with another event",
        // TOP NAV BAR
        TOTAL_ORDERS: "Total Orders",
        TOTAL_GUESTS: "Total Gusets",
        GUESTS_LEFT: "Gusets Left",
        TOTAL_WALKINS: "Total Walkins",
        "REPLACE_BUTTON_LABEL": "Switch",
        "ADD_BUTTON_LABEL":"Add",
        "evening_SHIFT" : "Evening Shift",
        "morning_SHIFT" : "Morning Shift",
        "noon_SHIFT" : "Afternoon Shift",
        "ENTIRE_DAY" : "Entire Day",
        "ENTIRE_DAY_SHIFT" : "Entire Day",
        "SHIFT" : "Shift",
        "DEAD_EVENTS" : "Dead Events",
        "TO" : 'To',
        "MIN" : 'min',

        // ERRORS
        "ERROR_EVENT_MSG_NAME": "Please enter the event name",
        "ERROR_EVENT_MSG_SEATS": "Please pick at least one seat for the event",
        "ERROR_EVENT_MSG_PHONE": "Please enter phone number",
        "ERROR_EVENT_MSG_STARTTIME": "Start time is invalid",
        "ERROR_EVENT_MSG_ENDTIME": "End time is invalid",
        "ERROR_EVENT_MSG_COLLISION": "A Collision with another event was detected",

        // WARNINGS
        "INVALID_GUESTS_PER_15_WARNING" : "Amount of guests per 15 minutes limit was reached!",
        "REMOVE_EVENT_WARNING" : "Removing event is irreversible. Are you sure you want to continue ?"




    });


        $translateProvider.translations('he', {
                "EMAIL_ADDRESS": "כתובת דוא״ל",
                "PASSWORD": "סיסמא",
                "CONFIRM_PASSWORD": "אישור סיסמא",
                "DONE_HAVE_ACCOUNT_LABEL": "אין לך חשבון? לחץ כאן",
                "REGISTER_ACCOUNT_LABEL": "הרשמה לחשבון חדש",
                "REGISTER": "הרשמה",
                "ALREADY_REGISTERED_LABEL": "משתמש רשום? לחץ כאן",
                "YOUR_BUSINESSES": "העסק שלך",
                "ADD_NEW_BUSINESS": "הוספת עסק חדש",
                "ADD_NEW_BUSINESS_LABEL": "add new business",
                "BUSINESS_NAME": "שם העסק",
                "BUSINESS_TYPE": "סוג העסק",
                "BUSINESS_AREA": "מיקום העסק",
                "BUSINESS_SIZE": "גודל העסק",
                "CREATE": "צור",
                "STATUS": "מצב",
                "NAME": "שם מלא",
                "GUESTS": "מוזמנים",
                "SEATS": "שולחנות",
                "TIME": "שעה",
                "PHONE": "טלפון",
                "EMAIL": "כתובת דוא\"ל",
                "CONTACT_PERSON": "איש קשר",
                "CONTACT_COMMENT": "הערה קבועה",
                "COMMENT": "הערה להזמנה",
                "HOSTESS": "מארחת",
                "EVENT_DURATION": "משך",
                "BACK": "חזור",
                "DELETE": "מחק",
                "SAVE": "שמור",
                "OCCASIONAL": "מזדמן",
                "ALL": "הכל",
                "SEATING": "יושבים",
                "SEATED": "יושבים",
                "ORDERED": "מוזמנים",
                "CONFIRMED": "מאושר",
                "CHEQUE": "חשבון",
                "FINISHED": "הסתיים",
                "NO_SHOW": "הבריז",
                "ERROR_MSG_COLLISION": "תקלה: אירוע זה מתנגש עם אירוע אחר",
                "TOTAL_ORDERS": "מספר הזמנות",
                "TOTAL_GUESTS": "מספר אורחים ",
                "GUESTS_LEFT": "אורחים נותרו",
                "TOTAL_WALKINS": "מזדמנים",
                "REPLACE_BUTTON_LABEL": "החלף",
                "ADD_BUTTON_LABEL":"חדש",
                "evening" : "ערב",
                "morning" : "בוקר",
                "noon" : "צהריים",
                "evening_SHIFT" : "משמרת ערב",
                "morning_SHIFT" : "משמרת בוקר",
                "noon_SHIFT" : "משמרת צהריים",
                "ENTIRE_DAY" : "כל היום",
                "ENTIRE_DAY_SHIFT" : "כל היום",

                "SHIFT" : "משמרת",
                "DEAD_EVENTS" : "ארועים שהסתיימו",
                "TO" : 'עד',
                "MIN" : 'דקות',

                // ERRORS
                "ERROR_EVENT_MSG_NAME": "חובה למלא את שם הארוע",
                "ERROR_EVENT_MSG_SEATS": "חובה לבחור לפחות שולחן אחד",
                "ERROR_EVENT_MSG_PHONE": "חובה למלא מספר טלפון",
                "ERROR_EVENT_MSG_STARTTIME": "זמן התחלת הארוע לא קיים או לא תקין",
                "ERROR_EVENT_MSG_ENDTIME": "זמן סיום הארוע לא קיים או לא תקין",
                "ERROR_EVENT_MSG_COLLISION": "אותרה התנגשות עם ארוע נוסף, נא נסה שנית",

                // WARNING
                "INVALID_GUESTS_PER_15_WARNING" : "הגבלת מספר סועדים לרבע שעה נחצתה.",
                "REMOVE_EVENT_WARNING" : "מחיקת אירוע הינה פעולת בלתי הפיכה. האם ברצונך להמשיך ?"
            }
        );


        $translateProvider.preferredLanguage('en');
});

