import { startListening as bStartListening, stopListening as bStopListening } from './client-broadcast-service';
import { getLastKnownAccount, getLastKnownRealm, getLastKnownUsername, isLoggedIn } from './auth-service';
import { executeModule } from './action-service';
import { deleteMessages } from './mailbox-service';
import { getSessionStorageItem, removeSessionStorageItem, setSessionStorageItem } from './public-utils';

const VOYENT_INJECT_KEY = 'voyentNotificationToInject';
const VOYENT_TOAST_CONTAINER_ID = 'voyent_toast_container';
const VOYENT_MAIL_QUERY_PARAMETER = 'nid';

let TOAST_Y_POS = 100; // The starting vertical position of toast notifications from the top or bottom of the page
// List of the currently displayed toast notifications
let _displayedToasts = {
    "top-right":[],
    "bottom-right":[],
    "top-left":[],
    "bottom-left":[]
};
// List of the queued notifications (notifications waiting to display)
let _queuedToasts = {
    "top-right":[],
    "bottom-right":[],
    "top-left":[],
    "bottom-left":[]
};
var _isInitialized = false; // Indicates if voyentNotifyInitialized has fired.
let _listener = null; // Reference to the push listener
let _pushServiceStarted = false; // Flag indicating if the push service is initialized
let _queuedGroups = []; // Groups waiting for the push service to be started before they are joined

//**************************************************************************************************************
//************************************************* PUBLIC API *************************************************
//**************************************************************************************************************
 /**
 * @property {String[]} groups - The groups currently registered for notifications (readonly).
 * @default []
 */
export let groups = [];

/**
 * @property {Object} selected - The selected notification (readonly).
 * @default null
 */
export let selected = null;

/**
 * @property {Object[]} queue - The notification queue (readonly).
 * @default []
 */
export let queue = [];

/**
 * @property {Object[]} alerts - The matching list of alerts for our notifications (readonly).
 * @default []
 */
export let alerts = [];

/**
 * @property {number} queuePosition - The zero-based index of the selected notification in the queue (readonly).
 * @default -1
 */
export let queuePosition = -1;

export const config = { //config options
    /**
     * @property {string} autoSelectNotification - Provides options for auto selecting notifications so that
     * each time a selected notification is removed a new one is selected. One of [disabled|oldest|newest].
     * @default 'disabled'
     */
    autoSelectNotification: 'disabled',
    setAutoSelectNotification: function(val) {
        val = val.toLowerCase();
        if (['disabled','oldest','newest'].indexOf(val) > -1) {
            this.autoSelectNotification = val;
        }
        else { this.autoSelectNotification = 'disabled'; }
    },

    /**
     * @property {boolean} hideAfterClick - Indicates if notifications should be hidden after clicking on them.
     * @default true
     */
    hideAfterClick: true,
    setHideAfterClick(val) { this.hideAfterClick = !!val; },

    /**
     * @property {boolean} useSubjectAsMessage - Indicates whether the subject should be used as the message.
     * When this is enabled the detail will be replaced with the subject and the detail will not be displayed.
     * @default true
     */
    useSubjectAsMessage: true,
    setUseSubjectAsMessage(val) { this.useSubjectAsMessage = !!val; },

    badgeUrl: '',
    setBadgeUrl(val) {
        if (typeof val === 'string' && val.trim()) {
            this.badgeUrl = val;
        }
    },

    toast: { //toast notification config options
        /**
         * @property {boolean} enabled - Indicates if toast notifications should be shown.
         * @default true
         */
        enabled: true,
        setEnabled(val) { this.enabled = !!val; },

        /**
         * @property {number} hideAfterMs - Time in milliseconds that the notification will be automatically
         * hidden after shown (specify <=0 to never hide the notification, making the toast closable only by clicking).
         * @default 5000
         */
        hideAfterMs: 5000,
        setHideAfterMs(val) {
            if (typeof val === 'number') { this.hideAfterMs = Math.round(val); }
            else { this.hideAfterMs = 5000; }
        },

        /**
         * @property {number} stackLimit - Indicates the number of notifications that will be allowed to
         * stack (specify <=0 to have no limit).
         * @default 3
         */
        stackLimit: 3,
        setStackLimit(val) {
            if (typeof val === 'number') { this.stackLimit = Math.round(val); }
            else { this.stackLimit = 3; }
        },

        /**
         * @property {boolean} overwriteOld - Indicates if new toast notifications should overwrite/replace
         * old ones in the stack.
         * @default false
         */
        overwriteOld: false,
        setOverwriteOld(val) { this.overwriteOld = !!val; },

        /**
         * @property {string} position - Position of toast notifications on page.
         * One of [top-right|top-left|bottom-right|bottom-left].
         * @default 'top-right'
         */
        position:'top-right',
        setPosition(val) {
            val = val.toLowerCase();
            if (['top-right','top-left','bottom-right','bottom-left'].indexOf(val) > -1) {
                this.position = val;
            }
            else { this.position = 'top-right'; }
        },

        /**
         * @property {number} spacing - Number of pixels that the toast notifications should be spaced apart.
         * @default 2
         */
        spacing:2,
        setSpacing(val) {
            if (typeof val === 'number') { this.spacing = Math.round(val); }
            else { this.spacing = 2; }
        },

        /**
         * @property {string} style - Custom styling that is applied to the top-level toast notification
         * container. Any styling defined here will override the defaults.
         * @default ''
         */
        style:'',
        setStyle(val) { this.style = val.toString(); },

        close: { //toast notification close container config options
            /**
             * @property {boolean} enabled - Indicates if the close button should be shown for toast notifications.
             * @default true
             */
            enabled: false,
            setEnabled(val) { this.enabled = !!val; },

            /**
             * @property {string} style - Custom styling that is applied to the toast notification close
             * container. Any styling defined here will override the defaults.
             * @default ''
             */
            style:'',
            setStyle(val) { this.style = val.toString(); },
        }
    },

    native: { //native/desktop notification config options
        /**
         * @property {boolean} enabled - Indicates if native notifications should be enabled (still must be
         * allowed by user in browser).
         * @default true
         */
        enabled: true,
        setEnabled(val) { this.enabled = !!val; },

        /**
         * @property {number} hideAfterMs - Time in milliseconds that the notification will be automatically
         * hidden after shown (specify <=0 to never hide the notification).
         * @default -1
         */
        hideAfterMs: -1,
        setHideAfterMs(val) {
            if (typeof val === 'number') { this.hideAfterMs = Math.round(val); }
            else { this.hideAfterMs = -1; }
        },
    }
};

//Events

//Useful for setting config options, setting up event listeners, etc...
/**
 * Fired after the library is initialized and listening for new notifications. This is the recommended place
 * to change default configuration options if the listener is guaranteed to exist before the library loads.
 * Only fires on initial load.
 * Not cancelable.
 * @event voyentNotifyInitialized
 */

/**
 * Fired after a new notification is received in the browser. Not cancelable.
 * @event notificationReceived
 */

//Useful for previewing the new item being added to the queue and throwing it away before it's added using preventDefault().
/**
 * Fired before the queue is updated. An update will be triggered when loading a queue from
 * storage or adding, removing or clearing the queue. Cancel the event to prevent the operation.
 * @event beforeQueueUpdated
 */

//Useful for keeping the various aspects of the app in sync (queue, notification count, etc...)
/**
 * Fired after the queue is updated. Not cancelable.
 * @event afterQueueUpdated
 */

//Useful for preventing the notification from being displayed using e.preventDefault().
/**
 * Fired before a notification is displayed. Fires for both toast and browser native notifications.
 * Cancel the event to prevent the notification from being displayed.
 * @event beforeDisplayNotification
 */

//Useful for custom CSS effects/styling
/**
 * Fired after a notification is displayed. Fires for both toast and browser native notifications. Not cancelable.
 * @event afterDisplayNotification
 */

//Useful to do custom handling on the selected notification. Especially after the asynchronous call of fetching a notification from the mailbox service.
/**
 * Fired after the selected property is changed. The notification returned may be null. If this event fires
 * in relation to a queue update then this event will always be fired AFTER the queue has been updated. Not cancelable.
 * @event notificationChanged
 */

//Useful for custom redirecting (for apps that use custom routing).
/**
 * Fired when a notification is clicked. Fires for both toast and browser native notifications. Cancel the
 * event to prevent the app from redirecting to the URL specified in the notification.
 * @event notificationClicked
 */

//Useful for custom close behaviour or preventing the notification from closing.
/**
 * Fired when a notification is closed. Fires for both toast and browser native notifications. Cancel the event
 * to prevent the notification from closing automatically (toast notifications only).
 * @event notificationClosed
 */

/**
 * Initialize the library. This function MUST be called to enable the library. The initialization process may
 * fire various events so we always suggest calling this after you setup any listeners of interest. Can be
 * triggered before or after logging in.
 */
export const initialize = function() {
    if (!isLoggedIn()) {
        window.addEventListener('onAfterLogin',_setupListeners);
    }
    else {
        _setupListeners();
    }
};

/**
 * Start listening for notifications. This function is called automatically when the library is initialized and
 * a user is logged in via voyent.js. This function only needs to be called manually after stopListening has
 * been called.
 */
export const startListening = function() {
    if (_listener) { return; }

    // Declare push listener
    _listener = function (notification) {
        if (!_isNotificationValid(notification)) {
            console.log('Notification received but ignored due to value:', notification);
            return;
        }
        console.log('Notification received:',JSON.stringify(notification));
        _fireEvent('notificationReceived',{"notification":notification},false);
        let cancelled = _fireEvent('beforeQueueUpdated',{"op":"add","notification":notification,"queue":queue.slice(0)},true);
        if (cancelled) {
            return;
        }
        _addAlertToList(notification.alertId).then(function() {
            _removeDuplicateNotifications(notification);
            queue.push(notification);
            _fireEvent('afterQueueUpdated',{"op":"add","notification":notification,"queue":queue.slice(0)},false);
            displayNotification(notification);
            if (!selected) {
                // We don't have a selected notification so set to this new one
                selectNotification(notification);
                // Inject notification data into the page if they are on the
                // relevant page and currently have no selected notification
                let notificationUrl = document.createElement('a'); //use anchor tag to parse notification return URL
                notificationUrl.href = notification.url;
                if (window.location.host === notificationUrl.host &&
                    window.location.pathname === notificationUrl.pathname) {
                    injectNotificationData();
                }
            }
        });
    };

    // Start the push service if we haven't already
    if (!_pushServiceStarted) {
        _pushServiceStarted = true;
        // Join any queued push groups
        for (let i=0; i<_queuedGroups.length; i++) {
            joinGroup(_queuedGroups[i]);
        }
    }

    // Add a group listener for the current user's username
    joinGroup(getLastKnownUsername(), true);
};

/**
 * Stop listening for notifications for all groups currently joined. No new notifications will be received
 * by the library after calling this function but the other features of the library will still be available.
 */
export const stopListening = function() {
    for (let i=0; i<groups.length; i++) {
        leaveGroup(groups[i]);
    }
    _listener = null;
    //since they explicitly stopped listening them remove the login listener as well
    window.removeEventListener('onAfterLogin',_setupListeners);
};

/**
 * Registers a new push listener for the specified group.
 * @param group
 * @param noScoped
 */
export const joinGroup = function(group, noScoped) {
    if (group && typeof group === 'string') {
        // Try to append a valid Account & Realm to make sure we don't receive all messages from everywhere
        if (!noScoped && getLastKnownAccount() && getLastKnownRealm() && getLastKnownRealm() !== 'admin') {
            // Rare but just double check that we don't already have account + realm appended
            var acctRealm = getLastKnownAccount() + getLastKnownRealm();
            if (group.indexOf(acctRealm, group.length - acctRealm.length) === -1) {
                group += acctRealm;
            }
        }

        // Ensure we aren't already in this group
        if (groups.indexOf(group) === -1) {
            // The push service is not ready so add the group to the queue so we can add it later
            if (!_pushServiceStarted) {
                if (_queuedGroups.indexOf(group) === -1) {
                    _queuedGroups.push(group);
                }
                return;
            }

            bStartListening({
                'group': group,
                'callback': _listener
            }).then(function() {
                // Remove the group from the queue
                let index = _queuedGroups.indexOf(group);
                if (index > -1) {
                    _queuedGroups.splice(index,1);
                }
                // Add the group to our list of joined groups
                groups.push(group);
            }).catch(function(e) {
                _fireEvent('message-error','Error when joining group: ' +
                          (e.responseText || e.message || e), false);
            });
        }
    }
};

/**
 * Removes the registered push listener for the specified group.
 * @param group
 */
export const leaveGroup = function(group) {
    if (group && typeof group === 'string') {
        let index = groups.indexOf(group);
        if (index > -1) {
            bStopListening({
                'group': group
            }).then(function() {
                groups.splice(index,1);
            }).catch(function(e) {
                console.error(e);
            });
        }
    }
};

/**
 * Fetches all the notifications and associated alerts for the user. If notifications are retrieved
 * then the queue will be cleared on the client and repopulated with the retrieved notifications.
 * @param nid - A notification id. If provided then the notification matching this `nid` will be automatically selected.
 */
export const refreshNotificationQueue = function(nid) {
    if (isLoggedIn()) {
        executeModule({ "id": "user-alert-details", "params": { } }).then(function(res) {
            if (res && res.messages) {
                let notifications = res.messages;
                let notification, existingNotification;
                clearNotificationQueue(false);
                alerts = [];
                for (let i = 0; i < notifications.length; i++) {
                    notification = notifications[i];
                    // Ensure we don't duplicate the notification in the queue in case it was received
                    // in the browser via broadcast before the user navigated from a non-browser transport
                    existingNotification = _getNotificationByNid(notification);
                    if (existingNotification) {
                        // Select the notification if we have a matching nid
                        if (nid && existingNotification.nid === nid) {
                            selectNotification(existingNotification);
                            injectNotificationData();
                        }
                    }
                    else {
                        let cancelled = _fireEvent('beforeQueueUpdated',{"op":"add","notification":notification,"queue":queue.slice(0)},true);
                        if (cancelled) {
                            continue;
                        }

                        // Check if we have a matching alert
                        // In which case we want to store the alert for later lookup
                        // We also want to port over any acknowledgement data to the notification itself
                        if (res.alerts) {
                            let matchingAlert = getAlertById(notification.alertId, res.alerts);
                            if (matchingAlert) {
                                alerts.push(matchingAlert);

                                // Set any acknowledgement data into the notification
                                if (notification.zoneId &&
                                    matchingAlert.properties && matchingAlert.properties[notification.zoneId] && matchingAlert.properties[notification.zoneId].acknowledgement) {
                                    notification.acknowledgement = matchingAlert.properties[notification.zoneId].acknowledgement;
                                }
                            }
                        }
                        queue.push(notification);
                        _fireEvent('afterQueueUpdated',{"op":"add","notification":notification,"queue":queue.slice(0)},false);

                        // Select the notification if we have a matching nid
                        if (nid && notification.nid === nid) {
                            selectNotification(notification);
                            injectNotificationData();
                        }
                    }
                }
                // If we don't have a selected notification then check if we have a notification in storage to select
                if (!selected) {
                    try {
                        let nidFromStorage = _getSelectedNidFromStorage();
                        if (nidFromStorage) {
                            //Select the notification and inject data.
                            let tmpNotification = {};
                            tmpNotification[VOYENT_MAIL_QUERY_PARAMETER] = nidFromStorage;
                            selectNotification(tmpNotification);
                            injectNotificationData();
                        }
                    }
                    catch(e) {
                        _fireEvent('message-error','Error loading selected notification from storage: ' +
                                                   (e.responseText || e.message || e), false);
                    }
                }
            }
        }).catch(function(e) {
            _fireEvent('message-error','Error trying to fetch notification: ' +
                (e.responseText || e.message || e), false);
        });
    }
};

/**
 * Tries to find an alert matching the passed id in the local list and returns it.
 * @param id
 * @param alertsArray
 * @returns {null|*}
 */
export const getAlertById = function(id, alertsArray) {
    if (!alertsArray && alerts) {
        alertsArray = alerts;
    }

    if (alertsArray && id) {
        for (let i=0; i<alertsArray.length; i++) {
            if (alertsArray[i]._id === id) {
                return alertsArray[i];
            }
        }
    }
    return null;
};

/**
 * Tries to find an alert matching the passed id in the local list to return. If the alert
 * cannot be found then we will fetch the alert, add it to the list, and then return it.
 * @param id
 * @param alerts
 * @returns {Promise<*>}
 */
export const safelyGetAlertById = function(id, alerts) {
    return new Promise(function(resolve) {
        let alert = getAlertById(id, alerts);
        if (alert) {
            resolve(alert);
            return;
        }
        _addAlertToList(id).then(function(alert) {
            resolve(alert);
        });
    });
};

/**
 * Returns an integer that represents the number of notifications currently in the queue.
 * @returns {number} - The notification count.
 */
export const getNotificationCount = function() {
    return queue.length;
};

/**
 * Returns the notification at the specified index or null if none was found.
 * @param {number} index - The zero-based index of the notification in the queue.
 * @returns {Object} - The notification.
 */
export const getNotificationAt = function(index) {
    return queue[index] || null;
};

/**
 * Returns the next (newer) notification in the queue or null if there is no next.
 * @returns {Object} - The notification.
 */
export const getNextNotification = function() {
    let newPos = queuePosition+1;
    if (queue[newPos]) {
        return queue[newPos];
    }
    return null;
};

/**
 * Returns the previous (older) notification in the queue or null if there is no previous.
 * @returns {Object} - The notification.
 */
export const getPreviousNotification = function() {
    let newPos = queuePosition-1;
    if (queue[newPos]) {
        return queue[newPos];
    }
    return null;
};

/**
 * Returns the newest notification by date that is currently in the queue or null if the queue is empty.
 * @returns {Object} - The notification.
 */
export const getNewestNotification = function() {
    if (queue.length > 0) {
        return queue[queue.length-1];
    }
    return null;
};

/**
 * Returns the oldest notification by date that is currently in the queue or null if the queue is empty.
 * @returns {Object} - The notification.
 */
export const getOldestNotification = function() {
    if (queue.length > 0) {
        return queue[0];
    }
    return null;
};

/**
 * Removes the specified notification from the queue.
 * @param {Object} notification - The notification to be removed.
 * @returns {boolean} - Indicates if the notification was removed successfully.
 */
export const removeNotification = function(notification) {
    let index = queue.indexOf(notification);
    if (index > -1) {
        let cancelled = _fireEvent('beforeQueueUpdated',{"op":"del","notification":notification,"queue":queue.slice(0)},true);
        if (cancelled) {
            return false;
        }
        //if we have an id it means the notification is stored in the
        //mailbox service so we will delete it from the user's mail
        if (queue[index][VOYENT_MAIL_QUERY_PARAMETER]) {
            _removeNotificationFromMailbox(queue[index][VOYENT_MAIL_QUERY_PARAMETER]);
        }
        queue.splice(index,1);
        _fireEvent('afterQueueUpdated',{"op":"del","notification":notification,"queue":queue.slice(0)},false);
        return true;
    }
    return false;
};

/**
 * Removes the notification from the queue at the specified index.
 * @param {number} index - The zero-based index of the notification in the queue.
 * @returns {boolean} - Indicates if the notification was removed successfully.
 */
export const removeNotificationAt = function(index) {
    let notification = queue[index];
    if (notification) {
        let cancelled = _fireEvent('beforeQueueUpdated',{"op":"del","notification":notification,"queue":queue.slice(0)},true);
        if (cancelled) {
           return false;
        }
        //if we have an id it means the notification is stored in the
        //mailbox service so we will delete it from the user's mail
        if (notification[VOYENT_MAIL_QUERY_PARAMETER]) {
            _removeNotificationFromMailbox(notification[VOYENT_MAIL_QUERY_PARAMETER]);
        }
        queue.splice(index,1);
        _fireEvent('afterQueueUpdated',{"op":"del","notification":notification,"queue":queue.slice(0)},false);
        return true;
    }
    return false;
};

/**
 * Removes the selected notification. If successful the queuePosition will be reset to -1 indicating that no
 * notification is currently selected.
 * @returns {boolean} - Indicates if the notification was removed successfully.
 */
export const removeSelectedNotification = function() {
    if (!selected) {
        return false; //nothing to remove
    }
    let notification = queue[queuePosition];
    let cancelled = _fireEvent('beforeQueueUpdated',{"op":"del","notification":notification,"queue":queue.slice(0)},true);
    if (cancelled) {
        return false;
    }
    //remove the notification from the queue
    queue.splice(queuePosition,1);
    queuePosition = -1;
    _fireEvent('afterQueueUpdated',{"op":"del","notification":notification,"queue":queue.slice(0)},false);
    //reset the selected property
    //if we have an id it means the notification is stored in the
    //mailbox service so we will delete it from the user's mail
    if (selected[VOYENT_MAIL_QUERY_PARAMETER]) {
        _removeNotificationFromMailbox(selected[VOYENT_MAIL_QUERY_PARAMETER]);
    }
    selected = null;
    _setSelectedNotificationInStorage();
    _fireEvent('notificationChanged',{"notification":selected},false);
    autoSelectNotification();
    return true;
};

/**
 * Removes all notifications from the notification queue and resets the queuePosition to -1.
 * @param {boolean} deleteFromMailbox - Specifies whether the notifications should be removed from the user's mailbox as well.
 */
export const clearNotificationQueue = function(deleteFromMailbox) {
    if (!queue || queue.length === 0) {
        return; //queue is already empty
    }
    let cancelled = _fireEvent('beforeQueueUpdated',{"op":"clear","queue":queue.slice(0)},true);
    if (cancelled) {
        return;
    }
    for (let i=0; i<queue.length; i++) {
        if (deleteFromMailbox && queue[i][VOYENT_MAIL_QUERY_PARAMETER]) {
            _removeNotificationFromMailbox(queue[i][VOYENT_MAIL_QUERY_PARAMETER]);
        }
    }
    queue = [];
    queuePosition = -1;
    _fireEvent('afterQueueUpdated',{"op":"clear","queue":queue.slice(0)},false);
};

/**
 * Redirects the browser to the URL specified in the passed notification and injects the notification data into the page.
 * @param {Object} notification - The notification that determines where to redirect.
 */
export const redirectToNotification = function(notification) {
    if (!notification.url) {
        return;
    }
    //save the notification to inject in session storage so it survives the redirect
    selected = notification;
    _setSelectedNotificationInStorage();
    //redirect browser
    window.location.replace(notification.url);
};

/**
 * Injects the selected notification into elements with data-selected-* attributes.
 * Currently has special support for input and select elements. For all other elements the data
 * will be inserted as text content.
 */
export const injectNotificationData = function() {
    _injectOrClearNotficationData(false);
};

/**
 * Removes all injected notification data from the page.
 */
export const clearInjectedNotificationData = function() {
    _injectOrClearNotficationData(true);
};

/**
 * Sets the selected notification to the one passed if it is a valid notification in the queue.
 * @param {Object} notification - The notification object to be set.
 * @returns {boolean} - Indicates if the notification was set successfully.
 */
export const selectNotification = function(notification) {
    let i = queue.indexOf(notification);
    if (i > -1) {
        if (selected !== notification) {
            _selectNotification(notification,i);
        }
    }
    else if (typeof notification.nid !== 'undefined') {
        //In some cases, such as when loading a notification from storage, the object may actually
        //be different than the one in the queue even though it refers to the same notification. In these
        //cases we will fallback to checking the nid on the notification to look for a match.
        for (i=0; i<queue.length; i++) {
            if (queue[i].nid === notification.nid &&
                selected !== queue[i]) {
                _selectNotification(queue[i],i);
                return true;
            }
        }
    }
    return false;
};

/**
 * Sets the selected notification to the one in the queue at the specified index.
 * @param {number} index - The zero-based index of the notification in the queue.
 * @returns {boolean} - Indicates if the notification was set successfully.
 */
export const selectNotificationAt = function(index) {
    let notification = queue[index];
    if (notification && notification !== selected) {
        _selectNotification(notification,index);
        return true;
    }
    return false;
};

/**
 * Selects the passed notification.
 * @param notification
 * @param index
 * @private
 */
const _selectNotification = function(notification, index) {
    selected = notification;
    queuePosition = index;
    _setSelectedNotificationInStorage();
    _fireEvent('notificationChanged',{"notification":selected},false);
};

/**
 * Displays the passed notification as a toast or browser native notification, depending on the current
 * configuration. Can be used to re-display a notification from the queue or even to display a custom
 * notification that is not part of the queue.
 * @param {object} notification - The notification to display.
 */
export const displayNotification = function (notification) {
    if (config.native.enabled && window.Notification && Notification.permission === 'granted') {
        _displayNativeNotification(notification);
    }
    else if (config.toast.enabled) {
        _displayToastNotification(notification,false);
    }
};

/**
 * Manually hides a notification.
 * @param {Object} notification - A toast or browser native notification reference.
 * @param {number} ms - The number of milliseconds to wait before hiding the notification.
 */
export const hideNotification = function(notification,ms) {
    if (!notification || !notification.constructor) {
        return;
    }
    setTimeout(function() {
        if (notification.constructor === HTMLDivElement) { //toast notification
            //hide the toast via transform and opacity changes
            let position = notification.getAttribute('data-position');
            let hideTranslateY = position.indexOf('bottom') > -1 ? TOAST_Y_POS : -Math.abs(TOAST_Y_POS);
            notification.style.opacity = '0';
            notification.style.transform = 'translateY('+hideTranslateY+'px)';
            notification.style.webkitTransform = 'translateY('+hideTranslateY+'px)';
            setTimeout(function() {
                var toastContainer = document.getElementById(VOYENT_TOAST_CONTAINER_ID);
                if (toastContainer && toastContainer.contains(notification)) {
                    toastContainer.removeChild(notification);
                    _updateDisplayedNotifications(notification);
                }
            },400); //transition effect is for 300ms so remove the toast from the DOM after 400ms
        }
        else if (notification.constructor === Notification) { //native notification
            notification.close();
        }
    },typeof ms !== 'number' ? 0 : Math.round(ms));
};

//******************************************************************************************************************
//************************************************** PRIVATE API ***************************************************
//******************************************************************************************************************

/**
 * Setup the push listener. If this the first init then we'll also install the toast container, request
 * native notification permissions, inject notifications after redirects and get saved notifications from user's
 * mailboxes.
 * @private
 */
function _setupListeners() {
    startListening();
    if (!_isInitialized) {
        //fire the initialization event if we are actively listening for notifications
        if (_listener) {
            _fireEvent('voyentNotifyInitialized',{"config":config},false);
            _isInitialized = true;
        }

        //add our custom toast parent element to the page
        if (config.toast.enabled && !document.getElementById(VOYENT_TOAST_CONTAINER_ID)) {
            _createToastContainer();
        }

        //check for desktop notification support and request permission
        if (config.native.enabled && _isNewNotificationSupported()) {
            Notification.requestPermission(function(permission){});
        }
    }
}

/**
 * Since we keep alert notifications in the queue across revisions, this function ensures we
 * only have a single notification in the queue for a particular alertFamilyId and zoneId.
 * http://jira.icesoft.org/browse/VRAS-546
 * @param incomingNotification
 * @private
 */
function _removeDuplicateNotifications(incomingNotification) {
    for (let i=queue.length-1; i>=0; i--) {
        let notificationInQueue = queue[i];
        // Determine the zoneId of the incoming notification
        let newNotificationZoneId = incomingNotification.affectedLocations && incomingNotification.affectedLocations[0] ?
            incomingNotification.affectedLocations[0].properties.vras.insideZoneId : null;
        if (newNotificationZoneId) {
            // Add the zoneId directly to the notification so we can easily access it later
            incomingNotification.zoneId = newNotificationZoneId;
            // Check if we already have a notification in the queue for this zone and remove it. Once
            // we find a match we can bail as there will only be a single notification per zone
            if (notificationInQueue.alertFamilyId === incomingNotification.alertFamilyId &&
                notificationInQueue.zoneId === incomingNotification.zoneId) {
                queue.splice(i,1);
                return;
            }
        }
    }
}

/**
 * Returns a promise that fetches and adds the alert JSON associated with the passed alertId into the local list
 * so it is readily available. The promise resolves when the operation is finished, regardless of whether
 * we encountered an error. This is to ensure that the notification will always be displayed to the user.
 * @param alertId
 * @returns {Promise<any>}
 * @private
 */
function _addAlertToList(alertId) {
    return new Promise(function(resolve) {
        if (!alertId) {
            return resolve();
        }
        // Don't fetch the alert if it's already in the list
        for (let i=0; i<alerts.length; i++) {
            if (alertId === alerts[i]._id) {
                return resolve();
            }
        }
        // Fetch the alert and add it the list
        executeModule({
            id: 'get-alert-family-history',
            params: { alertIds: [ alertId ] }
        }).then(function(res) {
            let alert = (res && res[0]) || null;
            if (alert) {
                alerts.push(alert);
            }
            resolve(alert);
        }).catch(function(e) {
            console.error('Unable to retrieve alert JSON associated with notification', alertId, e);
            resolve();
        });
    });
}

 /**
 * Convenience function for firing an event.
 * @param {string} name - The name of the event.
 * @param {Object} detail - An object containing the data for the event.
 * @param {boolean} cancelable - Indicates if the event can be canceled or not.
 * @returns {boolean} - Indicates if the event was cancelled in at least one of the listening event handlers.
 * @private
 */
function _fireEvent(name,detail,cancelable) {
    let event = new CustomEvent(name,{"detail":detail,"bubbles":false,"cancelable":!!cancelable});
    return !document.dispatchEvent(event);
}

/**
 * Handles auto selecting the notification in the queue.
 * @private
 */
function autoSelectNotification() {
    switch (config.autoSelectNotification) {
        case 'oldest':
            selectNotification(getOldestNotification());
            break;
        case 'newest':
            selectNotification(getNewestNotification());
    }
}

/**
 * Returns the full badge URL for the notification. Since the badge property may be
 * the full URL or just the badge name we need to ensure we always return a full URL.
 * @param badge
 * @returns {string}
 * @private
 */
function _getBadgeUrl(badge) {
    if (badge.indexOf('http') === -1) {
        if (config.badgeUrl) {
            return config.badgeUrl + badge;
        }
        return '';
    }
    else {
        return badge;
    }
}

/**
 * Displays a browser native notification.
 * @param {Object} notification - The notification to display.
 * @private
 */
function _displayNativeNotification(notification) {
    let cancelled = _fireEvent('beforeDisplayNotification',{"notification":notification},true);
    if (cancelled) {
        return;
    }
    //configure the notification options
    let opts = {};
    if (!config.useSubjectAsMessage && notification.detail && notification.detail.trim().length > 0) {
        opts.body = notification.detail;
    }

    if (typeof notification.badge === 'string' && notification.badge) {
        opts.icon = _getBadgeUrl(notification.badge);
    }
    //display the notification
    let subject = notification.subject && notification.subject.trim().length > 0 ? notification.subject : '';
    let n = new Notification(subject,opts);
    //add onclick listener with default behaviour of redirecting
    n.onclick = function() {
        let cancelled = _fireEvent('notificationClicked',{"notification":notification,"native":n},true);
        if (config.hideAfterClick) {
            hideNotification(n,0);
        }
        if (cancelled) {
            return;
        }
        redirectToNotification(notification);
    };
    //add onclose listener
    n.onclose = function() {
        _fireEvent('notificationClosed',{"notification":notification,"native":n},false);
    };
    //add onshow listener for hiding the notifications after they are shown
    n.onshow = function() {
        _fireEvent('afterDisplayNotification',{"notification":notification,"native":n},false);
        //We use the onshow handler for hiding the notifications because in some browsers (like Chrome)
        //only three notifications are displayed at one time. If there are more than three notifications to show
        //then they will be queued in the background until they have room to be displayed. We only want to start
        //the hide timeout after they are actually shown on the page and not just added to the queue.
        if (config.native.hideAfterMs > 0) {
            hideNotification(n, config.native.hideAfterMs);
        }
    };
}

/**
 * Determines if we should display a toast notification or add it to the queue to display later.
 * @param notification - The notification to be displayed.
 * @param isVoyentMsg - Indicates whether this is a `message-info` or `message-error` notification.
 * @private
 */
function _displayToastNotification(notification,isVoyentMsg) {
    //default to bottom-right for messages
    let position = 'bottom-right';
    if (!isVoyentMsg) {
        let cancelled = _fireEvent('beforeDisplayNotification',{"notification":notification},true);
        if (cancelled) {
            return;
        }
        //since this is not a message then use the configured value
        position = config.toast.position;
    }
    //ensure we have the notification container in the DOM
    if (!document.getElementById(VOYENT_TOAST_CONTAINER_ID)) {
        _createToastContainer();
    }
    //setup new div for toast notification
    let toast = document.createElement('div');
    toast.setAttribute('data-position',position);
    if (isVoyentMsg) {
        toast.setAttribute('data-is-message','data-is-message');
    }
    _createToastChildren(toast,notification);
    _setToastStyle(toast);
    //add to DOM so we can determine the height of the notification
    document.getElementById(VOYENT_TOAST_CONTAINER_ID).appendChild(toast);
    //display or queue the notification depending on the stack
    setTimeout(function() {
        //display toast if there is room in the stack or there is no stack limit
        if ((config.toast.stackLimit > _displayedToasts[position].length) || config.toast.stackLimit <= 0) {
            _displayToast({"notification":notification,"toast":toast});
        }
        else {
            //since we can't add to stack, add to queue
            _queuedToasts[position].push({"notification":notification,"toast":toast});
            if (config.toast.overwriteOld) {
                //replace oldest notification
                hideNotification(_displayedToasts[position][0],0);
            }
        }
    },0);
}

/**
 * Displays a toast notification.
 * @param {Object} notificationData - An object containing a reference to the notification object and toast DOM element.
 */
function _displayToast(notificationData) {
    let position = notificationData.toast.getAttribute('data-position');
    //determine the y position where the new toast should be displayed
    let yPosition = 0;
    for (let i=0; i<_displayedToasts[position].length; i++) {
        let height = _displayedToasts[position][i].offsetHeight;
        yPosition += height+config.toast.spacing;
        //store height for later use if we haven't already set it
        if (!_displayedToasts[position][i].getAttribute('data-height')) {
            _displayedToasts[position][i].setAttribute('data-height',height.toString());
        }
    }
    //the y position will need to be negated if we are rendering the toast from the bottom of the page
    let trueYPosition = position.indexOf('bottom') > -1 ? (-Math.abs(yPosition)) : yPosition;
    notificationData.toast.style.opacity = 1;
    notificationData.toast.style.transform = 'translateY('+trueYPosition+'px)';
    notificationData.toast.style.webkitTransform = 'translateY('+trueYPosition+'px)';
    notificationData.toast.setAttribute('data-translate-y',yPosition.toString()); //store absolute y position for later use
    //store a reference to the toast
    _displayedToasts[position].push(notificationData.toast);
    //remove the toast from the queue
    let index = _queuedToasts[position].indexOf(notificationData);
    if (index > -1) {
        _queuedToasts[position].splice(index,1);
    }
    //hide the notification after set timeout
    if (config.toast.hideAfterMs > 0) {
        hideNotification(notificationData.toast,config.toast.hideAfterMs);
    }
    if (!notificationData.toast.getAttribute('data-is-message')) {
        _fireEvent('afterDisplayNotification',{"notification":notificationData.notification,"toast":notificationData.toast},false);
    }
}

/**
 * Handles sliding notifications in the stack up or down as notifications are removed from the stack.
 * @param {Object} toast - The toast DOM element that was just removed from the stack.
 * @private
 */
function _updateDisplayedNotifications(toast) {
    //check if we need to slide any notifications up, if the last notification
    //closed was in the last position then we don't need to slide
    let position = toast.getAttribute('data-position');
    let index = _displayedToasts[position].indexOf(toast);
    if (index > -1 && index !== _displayedToasts[position].length-1) {
        let isBottom = position.indexOf('bottom') > -1;
        //slide all notifications after the one that is being removed
        for (let i=index+1; i<_displayedToasts[position].length; i++) {
            let toastToSlide = _displayedToasts[position][i];
            let yPosition;
            //account for spacing between toasts
            let paddingMultiplier = index === 0 ? 1 : index;
            let padding = config.toast.spacing * paddingMultiplier;
            if (isBottom) { //slide down
                yPosition = -parseInt(toastToSlide.getAttribute('data-translate-y')) +
                            parseInt(toast.getAttribute('data-height')) + padding;
            }
            else { //slide up
                yPosition = parseInt(toastToSlide.getAttribute('data-translate-y')) -
                            parseInt(toast.getAttribute('data-height')) - padding;
            }
            toastToSlide.style.transform = 'translateY('+yPosition+'px)';
            toastToSlide.style.webkitTransform = 'translateY('+yPosition+'px)';
            //Always store the y position as a positive number since moving
            //away from `top` and `bottom` is always a positive number
            toastToSlide.setAttribute('data-translate-y',Math.abs(yPosition));
        }
    }
    //keep the list of displayed toasts in sync
    let toastIndex = _displayedToasts[position].indexOf(toast);
    if (toastIndex > -1) {
        _displayedToasts[position].splice(toastIndex,1);
    }
    //display the next notification in the queue
    let nextToast = _queuedToasts[position][0];
    if (nextToast) {
        _displayToast(nextToast);
    }
}

/**
 * Creates the toast notification container.
 * @private
 */
function _createToastContainer() {
    waitForBody();
    function waitForBody() {
        if (!document || !document.body) {
            setTimeout(waitForBody,100);
            return;
        }
        let div = document.createElement('div');
        div.style.userSelect = div.style.webkitUserSelect = div.style.mozUserSelect = div.style.msUserSelect = 'none';
        div.id = VOYENT_TOAST_CONTAINER_ID;
        document.body.appendChild(div);
    }
}

/**
 * Adds child elements to the toast DOM element.
 * @param {Object} toast - The toast DOM element container.
 * @param {Object} notification - The notification to be rendered inside the toast.
 * @private
 */
function _createToastChildren(toast,notification) {
    let isVoyentMsg = toast.getAttribute('data-is-message');
    //add close button, if enabled
    if (config.toast.close.enabled) {
        let closeDiv = document.createElement('div');
        closeDiv.className = 'close';
        closeDiv.style.float = 'right';
        closeDiv.style.fontSize = '15px';
        closeDiv.style.color = '#f1f1f1';
        closeDiv.style.cursor = 'pointer';
        closeDiv.style.marginTop = '-10px';
        closeDiv.style.marginBottom = '-10px';
        //append user's custom styling
        closeDiv.setAttribute('style',closeDiv.getAttribute('style')+config.toast.close.style);
        //add X character
        closeDiv.innerHTML = '&#10006;';
        //add onclick listener with default behaviour of closing the notification, don't support events for voyent messages
        closeDiv.onclick = function(e) {
            // Prevent the event from bubbling so the notification onclick does not fire as well
            if (e.stopPropagation) { e.stopPropagation(); }
            if (!isVoyentMsg) {
                let cancelled = _fireEvent('notificationClosed',{"notification":notification,"toast":toast},true);
                if (cancelled) {
                    return;
                }
            }
            hideNotification(toast,0);
        };
        toast.appendChild(closeDiv);

        //add clear float
        let clearClose = document.createElement('div');
        clearClose.style.clear = 'both';
        toast.appendChild(clearClose);
    }
    //add badge, if provided
    if (typeof notification.badge === 'string' && notification.badge) {
        let iconDiv = document.createElement('div');
        iconDiv.className = 'icon';
        iconDiv.style.maxWidth = '40px';
        iconDiv.style.marginRight = '10px';
        iconDiv.style.float = 'left';

        let icon = document.createElement('img');
        icon.src = _getBadgeUrl(notification.badge);
        icon.style.display = 'block';
        icon.style.height = '100%';
        icon.style.width = '100%';
        iconDiv.appendChild(icon);
        toast.appendChild(iconDiv);
    }
    //add subject, if provided
    if (notification.subject && notification.subject.trim().length > 0 && !config.useSubjectAsMessage) {
        let titleDiv = document.createElement('div');
        titleDiv.className = 'subject';
        titleDiv.style.fontSize = '16px';
        titleDiv.style.marginBottom = '5px';
        titleDiv.innerHTML = notification.subject;
        toast.appendChild(titleDiv);
    }

    //add message
    let msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    msgDiv.style.overflow = 'hidden';
    msgDiv.style.wordBreak = 'break-word';
    // Since we will always have one of a subject or detail ensure
    // we always fallback to the other so a message is always displayed
    if (config.useSubjectAsMessage || (!notification.detail && notification.subject)) {
        msgDiv.innerHTML = notification.subject.trim().length ? notification.subject : notification.detail;
    }
    else {
        msgDiv.innerHTML = notification.detail.trim().length ? notification.detail : notification.subject;
    }
    toast.appendChild(msgDiv);

    //add onclick listener with default behaviour of redirecting, don't support events for voyent messages
    if (!isVoyentMsg) {
        toast.onclick = function() {
            let cancelled = _fireEvent('notificationClicked',{"notification":notification,"toast":toast},true);
            if (config.hideAfterClick) {
                hideNotification(toast,0);
            }
            if (cancelled) {
                return;
            }
            redirectToNotification(notification);
        };
    }

    //add clear float
    let clearDiv = document.createElement('div');
    clearDiv.style.clear = 'left';
    toast.appendChild(clearDiv);
}

/**
 * Sets the styling for the toast notification.
 * @param {Object} toast - The toast DOM element container that styling should be set for.
 * @private
 */
function _setToastStyle(toast) {
    //default styling
    if (!toast.getAttribute('data-is-message')) {
        toast.style.cursor = 'pointer';
    }
    toast.style.position = 'fixed';
    toast.style.backgroundColor = '#323232';
    toast.style.color = '#f1f1f1';
    toast.style.minHeight = '45px';
    toast.style.minWidth = '288px';
    toast.style.padding = '15px';
    toast.style.boxSizing = 'border-box';
    toast.style.boxShadow = '0 2px 5px 0 rgba(0, 0, 0, 0.26)';
    toast.style.borderRadius = '2px';
    toast.style.margin = '12px';
    toast.style.fontSize = '14px';
    toast.style.transition = 'transform 0.3s, opacity 0.3s';
    toast.style.webKitTransition = '-webkit-transform 0.3s, opacity 0.3s';
    toast.style.opacity = '0';
    toast.style.maxWidth = '350px';
    toast.style.overflow = 'hidden';
    toast.style.zIndex = '999999';

    let position = toast.getAttribute('data-position');
    //styling specific to the position configuration
    switch (position) {
        case 'top-right':
            toast.style.right = '0';
            toast.style.top = '0';
            toast.style.transform = 'translateY('+(-Math.abs(TOAST_Y_POS))+'px)';
            toast.style.webkitTransform = 'translateY('+(-Math.abs(TOAST_Y_POS))+'px)';
            break;
        case 'bottom-right':
            toast.style.right = '0';
            toast.style.bottom = '0';
            toast.style.transform = 'translateY('+TOAST_Y_POS+'px)';
            toast.style.webkitTransform = 'translateY('+TOAST_Y_POS+'px)';
            break;
        case 'top-left':
            toast.style.left = '0';
            toast.style.top = '0';
            toast.style.transform = 'translateY('+(-Math.abs(TOAST_Y_POS))+'px)';
            toast.style.webkitTransform = 'translateY('+(-Math.abs(TOAST_Y_POS))+'px)';
            break;
        case 'bottom-left':
            toast.style.left = '0';
            toast.style.bottom = '0';
            toast.style.transform = 'translateY('+TOAST_Y_POS+'px)';
            toast.style.webkitTransform = 'translateY('+TOAST_Y_POS+'px)';
            break;
        default:
            //default to top-right
            toast.style.right = '0';
            toast.style.top = '0';
            toast.style.transform = 'translateY('+(-Math.abs(TOAST_Y_POS))+'px)';
            toast.style.webkitTransform = 'translateY('+(-Math.abs(TOAST_Y_POS))+'px)';
    }
    //append user's custom styling
    toast.setAttribute('style',toast.getAttribute('style')+config.toast.style);
}

/**
 * Searches for relevant DOM elements that notification data should be injected or cleared on.
 * @param {boolean} doClear - Determines if the notification data should be injected or cleared.
 * @private
 */
function _injectOrClearNotficationData (doClear) {
    let key, elements, i;
    let findElements = function(obj,keys) {
        for (key in obj) {
            if (!obj.hasOwnProperty(key)) {
                continue;
            }
            let val = obj[key];
            if (typeof val !== 'object') {
                //build the selector
                let selector = 'data-selected-' + (keys.length ? keys.join('-') + '-' + key : key);
                //find all matching DOM elements
                elements = document.querySelectorAll('['+selector+']');
                //inject the data for each element
                for (i=0; i<elements.length; i++) {
                    val = (selector === 'data-selected-time') ? new Date(val) : val;
                    _injectOrClearDataForType(elements[i],val,doClear);
                }
            }
            else {
                //we may need to inject sub properties of this object
                findElements(val,keys.concat([key]));
            }
        }
    };
    if (selected) {
        findElements(selected,[]);
    }
}

/**
 * Injects or clears data data in a way specific to the type of DOM element.
 * @param {Object} element - The element to inject or clear notification data on.
 * @param {Object} data - The data to inject, if applicable.
 * @param {boolean} doClear - Determines if the notification data should be injected or cleared.
 * @private
 */
function _injectOrClearDataForType (element,data,doClear) {
    switch (element.tagName) {
        case 'INPUT':
            //set the input value
            element.value = doClear ? '' : data;
            break;
        case 'SELECT':
            //only proceed if we have an actual Array
            if (!Array.isArray(data)) {
                return;
            }
            //always clear out the select of any old options
            element.value = '';
            while (element.options.length) { element.remove(0); }
            if (doClear) {
                //nothing else to do
                return;
            }
            for (let i=0; i<data.length; i++) {
                //generate select options for array elements
                let opt = document.createElement("option");
                //support objects with value and label properties
                opt.value = data[i].value || data[i];
                opt.textContent = data[i].label || data[i];
                element.appendChild(opt);
            }
            break;
        default:
            //for all other cases just set the text content of the element
            element.textContent = doClear ? '' : data;
    }
}

/**
 * Determines if the browser supports the Notification constructor.
 * @returns {boolean} - Indicates if "new Notification()" is supported.
 * @private
 */
function _isNewNotificationSupported() {
    if (window.Notification && Notification.requestPermission) {
        if (Notification.permission === 'granted') {
            return true;
        }
    }
    else {
        return false;
    }
    //Special case below for Android Chrome since it doesn't currently support non-persistent notifications
    //https://bugs.chromium.org/p/chromium/issues/detail?id=481856
    //Eventually it would be nice to support persistent (ServiceWorkerRegistration) Notifications
    try {
        new Notification('');
    } catch (e) {
        if (e.name === 'TypeError') {
            return false;
        }
    }
    return true;
}

/**
 * Removes a saved notification from the user's mailbox.
 * @param {string} id - The id of the saved notification.
 * @private
 */
function _removeNotificationFromMailbox(id) {
    //if we have an id then this means the notification is
    //also stored in the mailbox service so we will delete it
    let query = {}; query[VOYENT_MAIL_QUERY_PARAMETER] = id;
    deleteMessages({"username":getLastKnownUsername(),
                                 "query":query}).then(function() {
    }).catch(function(e) {
        _fireEvent('message-error','Error deleting notification: ' +
                  (e.responseText || e.message || e), false);
    });
}

/**
 * Returns a notification from the queue that matches the passed notification
 * by comparing the VOYENT_MAIL_QUERY_PARAMETER property.
 * @param notification - The notification to compare against the queue.
 * @returns {Object} - The matching notification in the queue.
 * @private
 */
function _getNotificationByNid(notification) {
    //loop backwards through the queue since it's most
    //likely any duplicate notifications were just added
    for (let i=queue.length-1; i >= 0; i--) {
        if (queue[i][VOYENT_MAIL_QUERY_PARAMETER] === notification[VOYENT_MAIL_QUERY_PARAMETER]) {
            return queue[i];
        }
    }
    return null;
}

/**
 * Stores the nid of the selected notification in session storage.
 * @private
 */
function _setSelectedNotificationInStorage() {
    let injectKey = VOYENT_INJECT_KEY + '_' + getLastKnownUsername();
    if (!selected || !selected.nid) {
        removeSessionStorageItem(btoa(injectKey));
    }
    else {
        setSessionStorageItem(btoa(injectKey),btoa(JSON.stringify(selected.nid)));
    }
}

/**
 * Returns whether the notification contains sufficient data.
 * @param n
 * @returns {boolean}
 * @private
 */
function _isNotificationValid(n) {
    return !!(n && typeof n === 'object' && Object.keys(n).length &&
        ((typeof n.detail === 'string' && n.detail.trim().length) ||
         (typeof n.subject === 'string' && n.subject.trim().length) ||
         n.isAppUpdate));
}

/**
 * Retrieves the nid of the selected notification from session storage.
 * @returns {Object} - The selected notification.
 * @private
 */
function _getSelectedNidFromStorage() {
    let injectKey = VOYENT_INJECT_KEY + '_' + getLastKnownUsername();
    let base64Notification = getSessionStorageItem(btoa(injectKey));
    return base64Notification ? JSON.parse(atob(base64Notification)) : null;
}

//Setup message info and error listeners
window.addEventListener('message-info',function(e) {
    if (typeof e.detail === 'string' && e.detail.trim()) {
        console.log('message-info:',e.detail);
        _displayToastNotification({"subject":e.detail},true);
    }
});
window.addEventListener('message-info-sticky',function(e) {
    if (typeof e.detail === 'string' && e.detail.trim()) {
        let hideMs = config.toast.hideAfterMs;
        let hideMsNative = config.native.hideAfterMs;
        config.toast.hideAfterMs *= 2;
        config.native.hideAfterMs *= 2;
        console.log('message-info-sticky:',e.detail);
        _displayToastNotification({"subject":e.detail},true);
        setTimeout(function() {
            config.toast.hideAfterMs = hideMs;
            config.native.hideAfterMs = hideMsNative;
        },1); // Need to order after the setTimeout used deeper in the notification toast
    }
});
window.addEventListener('message-success',function(e) {
    if (typeof e.detail === 'string' && e.detail.trim()) {
        let style = config.toast.style;
        config.toast.style = style + 'background-color:#008000;';
        console.log('message-success:',e.detail);
        _displayToastNotification({"subject":e.detail},true);
        config.toast.style = style;
    }
});
window.addEventListener('message-warn',function(e) {
    if (typeof e.detail === 'string' && e.detail.trim()) {
        let style = config.toast.style;
        config.toast.style = style + 'background-color:#FF7900;';
        console.warn('message-warn:',e.detail);
        _displayToastNotification({"subject":e.detail},true);
        config.toast.style = style;
    }
});
window.addEventListener('message-error',function(e) {
    if (typeof e.detail === 'string' && e.detail.trim()) {
        let style = config.toast.style;
        config.toast.style = style + 'background-color:#C70000;';
        console.error('message-error:',e.detail);
        _displayToastNotification({"subject":e.detail},true);
        config.toast.style = style;
    }
});
window.addEventListener('message-error-sticky',function(e) {
    if (typeof e.detail === 'string' && e.detail.trim()) {
        let style = config.toast.style;
        let hideMs = config.toast.hideAfterMs;
        let hideMsNative = config.native.hideAfterMs;
        config.toast.style = style + 'background-color:#C70000;';
        config.toast.hideAfterMs *= 2;
        config.native.hideAfterMs *= 2;
        console.error('message-error-sticky:',e.detail);
        _displayToastNotification({"subject":e.detail},true);
        config.toast.style = style;
        setTimeout(function() {
            config.toast.hideAfterMs = hideMs;
            config.native.hideAfterMs = hideMsNative;
        },1); // Need to order after the setTimeout used deeper in the notification toast
    }
});
