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
        LOGIN : ' Login',
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
        // Business Nav
        HOME: 'Home',
        EDIT_MAP: 'Edit Map',
        EDIT_SHIFTS: 'Edit Shifts',
        EDIT_EVENTS_STATUSES: 'Edit Events Statuses',
        EVENTS_MANAGEMENT: 'Events',
        EDIT_EVENTS_DURATION: 'Events Durations',
        // MAP
        NO_RECENT_EVENTS_FOR_SEAT : 'No recent events for seat',

        // GENERAL
        CREATE: 'Create',
        // EVENTS
        STATUS: 'Status',
        NAME: 'Name',
        GUESTS_AMOUNT: 'Guests',
        GUESTS_AMOUNT_SHORT: '#',
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
        DESTINATION : "Destination",
        ALL: "All",
        SEATING: "Seating",
        SEATED: "Seating",
        CONFIRMED: "Confirmed",
        CHEQUE: "Cheque",
        FINISHED: "Finished",
        NO_SHOW: "No Show",
        CANCELED : "Canceled",
        DASHBOARD : "Dashboard",
        LOGOUT : "Logout",
        SELECT_SHIFT : 'Select Shift',
        NEW_EVENT : 'New Event',
        EDITED_EVENT : 'Editing Event',
        MINUTES_SHORT : 'mins',
        HOURS_SHORT : 'hrs',
        default : 'Default',

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
        "ENTIRE_SHIFT": "Entire Shift",
        "SHIFT" : "Shift",
        "DEAD_EVENTS" : "Dead Events",
        "SHOW_DEAD_EVENTS" : "Show Dead Events",
        "HIDE_DEAD_EVENTS" : "Hide Dead Events",
        "UPCOMING_EVENTS_TITLE" : "Upcoming Events",
        "TO" : 'To',
        "MIN" : 'min',
        "NOW" : "Now",
        "GO_TO_NOW" : "Go To Now",
        "TOTAL_EVENTS": "Total Events",
        "TOTAL_GUESTS": "Total Guests",
        "SEARCH" : "Search",
        "SWITCH_TO_HEBREW" : "עברית",
        "SWITCH_TO_ENGLISH" : "English",
        "SWITCH_TABLES" : "Switch",
        "SWITCH_MODE_TITLE" : "Switch Mode - Pick 2 events",
        "MAX_DURATION_FOR_EVENT_LABEL" : "Maximum duration for this seats",
        // ERRORS
        "ERROR_EVENT_MSG_NAME": "Please enter the event name",
        "ERROR_EVENT_MSG_SEATS": "Please pick at least one seat for the event",
        "ERROR_EVENT_MSG_PHONE": "Please enter phone number",
        "ERROR_EVENT_MSG_STARTTIME": "Start time is invalid",
        "ERROR_EVENT_MSG_ENDTIME": "End time is invalid",
        "ERROR_EVENT_MSG_COLLISION": "A Collision with another event was detected",
        "ERROR_EVENT_MSG_HOST" : "Please enter host name",
        "ERROR_EVENT_SWITCH_COLLISION" : "Cannot perform this action because one of the events collide with another event. Please try again",

        // WARNINGS
        "ARE_YOU_SURE" : "Are You Sure ? ",
        "INVALID_GUESTS_PER_15_WARNING" : "Amount of guests per 15 minutes limit was reached!",
        "REMOVE_EVENT_WARNING" : "Removing event is irreversible. Are you sure you want to continue ?",
        "SWITCH_EVENT_WARNING" : "Please finish or cancel events switching before continue",
        "NEW_EVENT_WARNING" : "Please finish or cancel adding new event",


        "LOADING_TEXT" : "Loading Zed...",

        //MAP
        "ADD_DESTINATION_BUTTON" : "New Reservation",
        "ADD_OCCASIONAL_BUTTON" : "Add Walkin",
        "PAST_EVENTS" : "Past Reservations",
        "NOW_EVENTS" : "Current Reservations",
        "FUTURE_EVENTS" : "Upcoming Reservations",
        "NEXT_EVENT" : "Next Reservation in",
        // SHIFTS
        "END_TIME" : "End",
        "START_TIME" : "Start",
        "DEFAULT_TIME" : "Default",
        //DAYS
        "SUNDAY" :"Sunday",
        "MONDAY" : "Monday",
        "TUESDAY" :"Tuesday",
        "WEDNESDAY" :"Wednesday",
        "THURSDAY" :"Thursday",
        "FRIDAY" : "Friday",
        "SATURDAY" :"Saturday"


    });


        $translateProvider.translations('he', {
                "EMAIL_ADDRESS": "כתובת דוא״ל",
                "PASSWORD": "סיסמא",
                "CONFIRM_PASSWORD": "אישור סיסמא",
                "DONE_HAVE_ACCOUNT_LABEL": "אין לך חשבון? לחץ כאן",
                "REGISTER_ACCOUNT_LABEL": "הרשמה לחשבון חדש",
                "REGISTER": "הרשמה",
                "LOGIN" : ' התחבר',
                "ALREADY_REGISTERED_LABEL": "משתמש רשום? לחץ כאן",
                "YOUR_BUSINESSES": "העסקים שלי",
                "ADD_NEW_BUSINESS": "הוספת עסק חדש",
                "ADD_NEW_BUSINESS_LABEL": "add new business",
                "BUSINESS_NAME": "שם העסק",
                "BUSINESS_TYPE": "סוג העסק",
                "BUSINESS_AREA": "מיקום העסק",
                "BUSINESS_SIZE": "גודל העסק",
                "HOME": "בית",
                "EDIT_MAP": "עורך מפה",
                "EDIT_SHIFTS": "עריכת משמרות",
                "EDIT_EVENTS_STATUSES": "סטטוסים",
                "EVENTS_MANAGEMENT": 'ניהול הזמנות',
                "EDIT_EVENTS_DURATION": 'שעות וסועדים',
                "NO_RECENT_EVENTS_FOR_SEAT" : 'לא נמצאו הזמנות אחרונות לשולחן זה',

                "CREATE": "צור",
                "SWITCH_TABLES" : "החלף",
                "SWITCH_MODE_TITLE" : "מצב החלפה - בחר 2 הזמנות",
                "STATUS": "מצב",
                "NAME": "שם מלא",
                "GUESTS_AMOUNT": "מספר אורחים",
                "GUESTS_AMOUNT_SHORT": '#',
                "SEATS": "שולחנות",
                "SEAT" : "שולחן",
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
                "DESTINATION" : "הזמנה",
                "ALL": "הכל",
                "SEATING": "יושבים",
                "SEATED": "יושבים",
                "ORDERED": "מוזמנים",
                "CONFIRMED": "מאושר",
                "CHEQUE": "חשבון",
                "FINISHED": "הסתיים",
                "NO_SHOW": "הבריז",
                "CANCELED" : "בוטל",
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
                "ENTIRE_SHIFT" : "משמרת מלאה",
                "NOW" : "עכשיו",
                "GO_TO_NOW" : "עבור לעכשיו",
                "TOTAL_EVENTS": "סה״כ אירועים",
                "TOTAL_GUESTS": "סה״כ מוזמנים",
                "SEARCH" : "חיפוש",
                "SWITCH_TO_HEBREW" : "עברית",
                "SWITCH_TO_ENGLISH" : "English",
                "NEW_EVENT" : 'הזמנה חדשה',
                "EDITED_EVENT" : 'עריכת הזמנה',
                "MINUTES_SHORT" : 'דק',
                "HOURS_SHORT" : 'שעות',
                "DASHBOARD" : "דשבורד",
                "LOGOUT" : "יציאה מהמערכת",
                "SELECT_SHIFT" : 'בחירת משמרת',
                "MAX_DURATION_FOR_EVENT_LABEL" : "משך זמן מקסימלי לשולחנות שנבחרו",
                "SHIFT" : "משמרת",
                "DEAD_EVENTS" : "ארועים שהסתיימו",
                "SHOW_DEAD_EVENTS" : "הצג ארועים שהסתיימו",
                "HIDE_DEAD_EVENTS" : "הסתר ארועים שהסתיימו",
                "UPCOMING_EVENTS_TITLE" : "ארועים קרובים",
                "default" : 'ברירת מחדל',

                "TO" : 'עד',
                "MIN" : 'דקות',

                // ERRORS
                "ERROR_EVENT_MSG_NAME": "חובה למלא את שם הארוע",
                "ERROR_EVENT_MSG_SEATS": "חובה לבחור לפחות שולחן אחד",
                "ERROR_EVENT_MSG_PHONE": "חובה למלא מספר טלפון",
                "ERROR_EVENT_MSG_STARTTIME": "זמן התחלת הארוע לא קיים או לא תקין",
                "ERROR_EVENT_MSG_ENDTIME": "זמן סיום הארוע לא קיים או לא תקין",
                "ERROR_EVENT_MSG_COLLISION": "אותרה התנגשות עם ארוע נוסף, נא נסה שנית",
                "ERROR_EVENT_MSG_HOST" : "חובה למלא את שם המארחת",
                "ERROR_EVENT_SWITCH_COLLISION" : "לא ניתן לבצע את ההחלפה, אחת מההזמנות מתנגשת עם הזמנה נוספת. נא נסה שנית.",
                // WARNING
                "ARE_YOU_SURE" : "בעיה",
                "INVALID_GUESTS_PER_15_WARNING" : "הגבלת מספר סועדים לרבע שעה נחצתה.",
                "WARNING_OUT_OF_SHIFTS" : "הארוע אינו נכלל במשמרות, האם ברצונך להמשיך ?",
                "REMOVE_EVENT_WARNING" : "מחיקת אירוע הינה פעולת בלתי הפיכה. האם ברצונך להמשיך ?",
                "SWITCH_EVENT_WARNING" : "יש לסיים החלפת שולחנות",
                "EDIT_EVENT_WARNING" : "יש לסיים עריכת ארוע",
                "NEW_EVENT_WARNING" : "יש לסיים הוספת ארוע",
                "LOADING_TEXT" : "טוען...",
                //MAP
                "ADD_DESTINATION_BUTTON" : "הזמנה חדשה",
                "ADD_OCCASIONAL_BUTTON" : "הוסף מזדמן",
                "PAST_EVENTS" : "הזמנות בעבר",
                "NOW_EVENTS" : "הזמנות כעת",
                "FUTURE_EVENTS" : "הזמנות עתידיות",
                "NEXT_EVENT" : "ההזמנה הקרובה בעוד",
                //SHIFTS
                "END_TIME" : "סיום",
                "START_TIME" : "התחלה",
                "DEFAULT_TIME" : "ברירת מחדל",
                //DAYS
                "SUNDAY" :"ראשון",
                "MONDAY" : "שני",
                "TUESDAY" :"שלישי",
                "WEDNESDAY" :"רביעי",
                "THURSDAY" :"חמישי",
                "FRIDAY" : "שישי",
                "SATURDAY" :"שבת"



            }
        );


        $translateProvider.preferredLanguage('en');
});

