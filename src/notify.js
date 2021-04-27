import { startListening as bStartListening, stopListening as bStopListening } from './client-broadcast-service';
import { getLastKnownAccount, getLastKnownRealm, getLastKnownUsername, isLoggedIn } from './auth-service';
import { executeModule } from './action-service';
import { deleteMessages } from './mailbox-service';
import { getSessionStorageItem, removeSessionStorageItem, setSessionStorageItem } from './public-utils';
import { VOYENT_INJECT_KEY } from './keys'

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
let queuedAlertPromises = {};
let lastKnownRealm = '';

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

/**
 * @property {boolean} alertListUpdatePending - Whether we are currently getting
 * the alert record for an alert notification broadcast that we received (readonly).
 */
export let alertListUpdatePending = false;

/**
 * @property {number} activeNotificationCount - The number of active notifications in the queue (readonly).
 */
let activeNotificationCount = 0;

/**
 * @property {number} endedNotificationCount - The number of ended notifications in the queue (readonly).
 */
let endedNotificationCount = 0;

/**
 * @property {number} unreadActiveNotificationCount - The number of unread active notifications in the queue (readonly).
 */
let unreadActiveNotificationCount = 0;

/**
 * @property {number} unreadEndedNotificationCount - The number of unread ended notifications in the queue (readonly).
 */
let unreadEndedNotificationCount = 0;

export const config = { // Config options
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
    setHideAfterClick: function(val) { this.hideAfterClick = !!val; },

    /**
     * @property {boolean} useSubjectAsMessage - Indicates whether the subject should be used as the message.
     * When this is enabled the detail will be replaced with the subject and the detail will not be displayed.
     * @default true
     */
    useSubjectAsMessage: true,
    setUseSubjectAsMessage: function(val) { this.useSubjectAsMessage = !!val; },

    badgeUrl: '',
    setBadgeUrl: function(val) {
        if (typeof val === 'string' && val.trim()) {
            this.badgeUrl = val;
        }
    },

    toast: { // Toast notification config options (applies to alert and message notifications)
        /**
         * @property {boolean} enabled - Indicates whether toast notifications should be shown. If disabled then
         *                               the alert.enabled and message.enabled properties have no effect.
         * @default true
         */
        enabled: true,
        setEnabled: function(val) { this.enabled = !!val; },

        alert: { // Alert notification config
            /**
             * @property {boolean} enabled - Indicates whether alert toast notifications should be shown.
             * @default true
             */
            enabled: true,
            setEnabled: function(val) { this.enabled = !!val; },
        },

        message: { // `message-*` notification config
            /**
             * @property {boolean} enabled - Indicates whether `message-*` toast notifications should be shown.
             * @default true
             */
            enabled: true,
            setEnabled: function(val) { this.enabled = !!val; },
        },

        /**
         * @property {number} hideAfterMs - Time in milliseconds that the notification will be automatically
         * hidden after shown (specify <=0 to never hide the notification, making the toast closable only by clicking).
         * @default 5000
         */
        hideAfterMs: 5000,
        setHideAfterMs: function(val) {
            if (typeof val === 'number') { this.hideAfterMs = Math.round(val); }
            else { this.hideAfterMs = 5000; }
        },

        /**
         * @property {number} stackLimit - Indicates the number of notifications that will be allowed to
         * stack (specify <=0 to have no limit).
         * @default 3
         */
        stackLimit: 3,
        setStackLimit: function(val) {
            if (typeof val === 'number') { this.stackLimit = Math.round(val); }
            else { this.stackLimit = 3; }
        },

        /**
         * @property {boolean} overwriteOld - Indicates if new toast notifications should overwrite/replace
         * old ones in the stack.
         * @default false
         */
        overwriteOld: false,
        setOverwriteOld: function(val) { this.overwriteOld = !!val; },

        /**
         * @property {string} position - Position of toast notifications on page.
         * One of [top-right|top-left|bottom-right|bottom-left].
         * @default 'top-right'
         */
        position:'bottom-right',
        setPosition: function(val) {
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
        setSpacing: function(val) {
            if (typeof val === 'number') { this.spacing = Math.round(val); }
            else { this.spacing = 2; }
        },

        /**
         * @property {string} style - Custom styling that is applied to the top-level toast notification
         * container. Any styling defined here will override the defaults.
         * @default ''
         */
        style:'',
        setStyle: function(val) { this.style = val.toString(); },

        close: { // Toast notification close container config options
            /**
             * @property {boolean} enabled - Indicates if the close button should be shown for toast notifications.
             * @default true
             */
            enabled: false,
            setEnabled: function(val) { this.enabled = !!val; },

            /**
             * @property {string} style - Custom styling that is applied to the toast notification close
             * container. Any styling defined here will override the defaults.
             * @default ''
             */
            style:'',
            setStyle: function(val) { this.style = val.toString(); },
        }
    },

    native: { // Native browser notification config options (applies to alert notifications only)
        /**
         * @property {boolean} enabled - Indicates if native notifications should be enabled (still must be
         * allowed by user in browser).
         * @default true
         */
        enabled: true,
        setEnabled: function(val) { this.enabled = !!val; },

        /**
         * @property {number} hideAfterMs - Time in milliseconds that the notification will be automatically
         * hidden after shown (specify <=0 to never hide the notification).
         * @default -1
         */
        hideAfterMs: -1,
        setHideAfterMs: function(val) {
            if (typeof val === 'number') { this.hideAfterMs = Math.round(val); }
            else { this.hideAfterMs = -1; }
        },
    }
};

// Events

// Useful for setting config options, setting up event listeners, etc...
/**
 * Fired after the library is initialized and listening for new notifications. This is the recommended place
 * to change default configuration options if the listener is guaranteed to exist before the library loads.
 * Only fires on initial load.
 * Not cancelable.
 * @event voyentNotifyInitialized
 */

/**
 * Fired after a new broadcast notification is received in the browser. Not cancelable.
 * @event broadcastReceived
 */

// Useful for previewing the new item being added to the queue and throwing it away before it's added using preventDefault().
/**
 * Fired before a received broadcast notification is added to the queue. Cancel the event to prevent the operation.
 * @event beforeBroadcastAdded
 */

// Useful for keeping the various aspects of the app in sync, such as the queue.
/**
 * Fired after a received broadcast notification is added to the queue. Not cancelable.
 * @event afterBroadcastAdded
 */

// Useful for previewing the new item being added to the queue and throwing it away before it's added using preventDefault().
/**
 * Fired before the queue is updated. An update will be triggered when loading a queue from
 * storage or adding, removing or clearing the queue. Cancel the event to prevent the operation.
 * @event beforeQueueUpdated
 */

// Useful for keeping the various aspects of the app in sync, such as the queue.
/**
 * Fired after the queue is updated. Not cancelable.
 * @event afterQueueUpdated
 */

// Useful for setting app state based on whether notifications are returned from the `refreshNotificationQueue` request
/**
 * Fired after `refreshNotificationQueue` completes successfully. Not cancelable.
 * @event notificationQueueRefreshed
 */

// Useful for preventing the notification from being displayed using e.preventDefault().
/**
 * Fired before a notification is displayed. Fires for both toast and browser native notifications.
 * Cancel the event to prevent the notification from being displayed.
 * @event beforeDisplayNotification
 */

// Useful for custom CSS effects/styling
/**
 * Fired after a notification is displayed. Fires for both toast and browser native notifications. Not cancelable.
 * @event afterDisplayNotification
 */

// Useful to do custom handling on the selected notification. Especially after the asynchronous call of fetching a notification from the mailbox service.
/**
 * Fired after the selected property is changed. The notification returned may be null. If this event fires
 * in relation to a queue update then this event will always be fired AFTER the queue has been updated. Not cancelable.
 * @event notificationChanged
 */

// Useful for custom redirecting (for apps that use custom routing).
/**
 * Fired when a notification is clicked. Fires for both toast and browser native notifications. Cancel the
 * event to prevent the app from redirecting to the URL specified in the notification.
 * @event notificationClicked
 */

// Useful for custom close behaviour or preventing the notification from closing.
/**
 * Fired when a notification is closed. Fires for both toast and browser native notifications. Cancel the event
 * to prevent the notification from closing automatically (toast notifications only).
 * @event notificationClosed
 */

/**
 * Initialize the library. This function must be called to enable the library. The initialization process may
 * fire various events so we always suggest calling this after you setup any listeners of interest. Can be
 * triggered before or after logging in.
 */
export const initialize = function() {
    // Setup the push listener
    startListening();
    // Do some additional initialization
    if (!isLoggedIn()) {
        window.addEventListener('onAfterLogin', _onAfterLogin);
    }
    else {
        _onAfterLogin();
    }
};

/**
 * Start listening for notifications. This function is called automatically when the library is initialized and
 * a user is logged in via voyent.js. This function only needs to be called manually after stopListening has
 * been called.
 */
export const startListening = function() {
    if (_listener) {
        return;
    }

    // Declare push listener
    _listener = function (notification) {
        if (!_isNotificationValid(notification)) {
            console.log('Broadcast received but ignored due to value:', notification);
            return;
        }
        // console.log('Broadcast received:',JSON.stringify(notification));
        _fireEvent('broadcastReceived',{"notification":notification},false);
        let cancelled = _fireEvent('beforeBroadcastAdded',{"notification":notification,"queue":queue.slice(0)},true);
        if (cancelled) {
            return;
        }
        alertListUpdatePending = true;
        _addAlertToList(notification.alertId).then(function() {
            alertListUpdatePending = false;
            _removeDuplicateNotifications(notification);
            queue.push(notification);
            incrementNotificationCount(notification);
            _fireEvent('afterBroadcastAdded',{"notification":notification,"queue":queue.slice(0)},false);
            displayAlertNotification(notification);
            /*if (!selected) {
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
            }*/
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
};

/**
 * Stop listening for notifications for all groups currently joined. No new notifications will be received
 * by the library after calling this function but the other features of the library will still be available.
 */
export const stopListening = function() {
    leaveAllGroups();
    _listener = null;
    // Since they explicitly stopped listening them remove the login listener as well
    window.removeEventListener('onAfterLogin', _onAfterLogin);
};

/**
 * Registers a new push listener for the specified group.
 * @param group
 * @param account
 * @param realm
 */
export const joinGroup = function(group, account, realm) {
    group = getFullGroupName(group, account, realm);
    if (group) {
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
 * @param account
 * @param realm
 */
export const leaveGroup = function(group, account, realm) {
    group = getFullGroupName(group, account, realm);
    leavePassedGroup(group);
};

/**
 * Private function that allows us to remove the passed group without namespacing the group name.
 * @param group
 */
const leavePassedGroup = function(group) {
    if (group) {
        // Ensure we are actually in this group
        let index = groups.indexOf(group);
        if (index > -1) {
            bStopListening({
                'group': group
            }).then(function() {
                // The index may change so get it again before splicing.
                groups.splice(groups.indexOf(group),1);
            }).catch(function(e) {
                console.error(e);
            });
        }
    }
};

/**
 * Returns the passed group name with the account and realm scoping added. If the
 * group name cannot be formed due to insufficient data then null will be returned.
 * @param group
 * @param account
 * @param realm
 * @returns {string|null}
 */
export const getFullGroupName = function(group, account, realm) {
    account = account || getLastKnownAccount();
    realm = realm || getLastKnownRealm();
    if (typeof group === 'string' && group.trim().length &&
        typeof account === 'string' && account.trim().length &&
        typeof realm === 'string' && realm.trim().length && realm !== 'admin') {
        return account + '_' + realm + '_' + group;
    }
    return null;
};

/**
 * Fetches all the notifications and associated alerts for the user. If notifications are retrieved
 * then the queue will be cleared on the client and repopulated with the retrieved notifications.
 * @param nid - A notification id. If provided then only the notification matching this `nid` will
 *              be retrieved. The notification matching this nid will also be automatically selected.
 */
export const refreshNotificationQueue = function(nid) {
    refreshNotificationQueuePromise(nid).catch(function(){});
};

/**
 * Returns a Promise that resolves when the notification queue is successfully refreshed and rejects
 * when the request fails or the user is not logged in. See `refreshNotificationQueue` for more details.
 */
export const refreshNotificationQueuePromise = function(nid) {
    return new Promise(function(resolve, reject) {
        if (isLoggedIn()) {
            let params = { u: getLastKnownUsername() };
            if (typeof nid === 'string' && nid) {
                params.nid = nid;
                // If a specific notification was requested don't refresh
                // the queue if we already have it, just select it.
                let requestedNotification = _getNotificationByNid(params);
                if (requestedNotification) {
                    selectNotification(requestedNotification)
                    return resolve();
                }
            }
            executeModule({ id: 'user-alert-details', params: params }).then(function(res) {
                loadUserAlertDetailsResponse(res, nid);
                resolve();
            }).catch(function(e) {
                _fireEvent('message-error','Unable to get notifications, try again later', false);
                reject(e);
            });
        }
        else {
            reject('user not logged in');
        }
    });
};

/**
 * Loads the response data from the `user-alert-details` module, replacing
 * the current queue amd alerts list with the passed response data.
 * @param res
 * @param nid
 */
export const loadUserAlertDetailsResponse = function(res, nid) {
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

                // Check if we have a matching alert, if we do then we want to store the alert for later
                // lookup. We also want to port over any acknowledgement data to the notification itself
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
                incrementNotificationCount(notification);
                _fireEvent('afterQueueUpdated',{"op":"add","notification":notification,"queue":queue.slice(0)},false);

                // Select the notification if we have a matching nid or reselect the notification
                // already selected in case its properties changed (such as `isZoneOutdated`).
                if ((nid && notification.nid === nid) ||
                    (!nid && selected && selected.nid && selected.nid === notification.nid)) {
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
                    // Select the notification and inject data.
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

        // Fire an event indicating that we are done refreshing the queue.
        let event = { queue: queue.slice(0) };
        if (nid) {
            event.nid = nid;
        }
        _fireEvent('notificationQueueRefreshed', event, false);
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
            return resolve(alert);
        }
        _addAlertToList(id).then(function(alert) {
            resolve(alert);
        });
    });
};

/**
 * Returns the alertFamilyState for the alert matching the passed alertId.
 * @param alertId
 * @returns {*}
 */
export const getAlertFamilyState = function(alertId) {
    let alert = getAlertById(alertId);
    return (alert && alert.latestRevision && alert.latestRevision.state) || null;
};

/**
 * Returns whether the passed notification is an alert notification.
 * @param n
 * @returns {boolean}
 */
export const isAlertNotification = function(n) {
    return !!(n && (!n.notificationType || n.notificationType === 'alert'));
};

/**
 * Returns whether the passed notification is considered to be active.
 * @param n
 * @returns {boolean}
 */
export const isActive = function(n) {
    let alert = getAlertById(n.alertId);
    let alertState = alert && alert.state;
    let alertFamilyState = getAlertFamilyState(n.alertId);
    if (alert && alert.schedule && alert.schedule.recurring) {
        return alertState === 'active';
    }
    if (alertFamilyState === 'scheduled') {
        return alertState === 'active';
    }
    return alertFamilyState === 'active';
};

/**
 * Returns whether the passed notification is considered to be ended.
 * @param n
 * @returns {boolean}
 */
export const isEnded = function(n) {
    let alert = getAlertById(n.alertId);
    let alertState = alert && alert.state;
    let alertFamilyState = getAlertFamilyState(n.alertId);
    if (alert && alert.schedule && alert.schedule.recurring) {
        return alertState === 'ended';
    }
    return alertFamilyState === 'ended';
};

/**
 * Returns the total number of notifications.
 * @returns {number} - The notification count.
 */
export const getTotalNotificationCount = function() {
    return queue.length;
};

/**
 * Returns the number of active notifications.
 * @returns {number}
 */
export const getActiveNotificationCount = function() {
    return activeNotificationCount;
};

/**
 * Returns the number of ended notifications.
 * @returns {number}
 */
export const getEndedNotificationCount = function() {
    return endedNotificationCount;
};

/**
 * Returns the number of unread active notifications.
 * @returns {number}
 */
export const getUnreadActiveNotificationCount = function() {
    return unreadActiveNotificationCount;
};

/**
 * Returns the number of unread ended notifications.
 * @returns {number}
 */
export const getUnreadEndedNotificationCount = function() {
    return unreadEndedNotificationCount;
};

/**
 * Returns the total (active and ended) number of unread notifications.
 * @returns {number}
 */
export const getTotalUnreadNotificationCount = function() {
    return unreadActiveNotificationCount + unreadEndedNotificationCount;
};

/**
 * Increments the notification counts relevant to the passed notification by 1.
 * @param n
 */
export const incrementNotificationCount = function(n) {
    if (isActive(n)) {
        activeNotificationCount++;
        if (!n.log || !n.log.readTime) {
            unreadActiveNotificationCount++;
        }
    }
    else if (isEnded(n)) {
        endedNotificationCount++;
        if (!n.log || !n.log.readTime) {
            unreadEndedNotificationCount++;
        }
    }
};

/**
 * Reduces the notification counts relevant to the passed notification by 1.
 * @param n
 */
export const reduceNotificationCount = function(n) {
    if (isActive(n)) {
        reduceActiveNotificationCount();
        if (!n.log || !n.log.readTime) {
            reduceUnreadActiveNotificationCount();
        }
    }
    else if (isEnded(n)) {
        reduceEndedNotificationCount();
        if (!n.log || !n.log.readTime) {
            reduceUnreadEndedNotificationCount();
        }
    }
};

/**
 * Reduces the active notification count by 1.
 */
export const reduceActiveNotificationCount = function() {
    if (activeNotificationCount > 0) {
        activeNotificationCount--;
    }
};

/**
 * Reduces the ended notification count by 1.
 */
export const reduceEndedNotificationCount = function() {
    if (endedNotificationCount > 0) {
        endedNotificationCount--;
    }
};

/**
 * Reduces the unread active notification count by 1.
 */
export const reduceUnreadActiveNotificationCount = function() {
    if (unreadActiveNotificationCount > 0) {
        unreadActiveNotificationCount--;
    }
};

/**
 * Reduces the unread ended notification count by 1.
 */
export const reduceUnreadEndedNotificationCount = function() {
    if (unreadEndedNotificationCount > 0) {
        unreadEndedNotificationCount--;
    }
};

/**
 * Resets all notification counts to 0.
 */
export const resetNotificationCounts = function() {
    activeNotificationCount = endedNotificationCount = 0;
    unreadActiveNotificationCount = unreadEndedNotificationCount = 0;
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
        // If we have an id it means the notification is stored in the
        // mailbox service so we will delete it from the user's mail
        if (queue[index][VOYENT_MAIL_QUERY_PARAMETER]) {
            _removeNotificationFromMailbox(queue[index][VOYENT_MAIL_QUERY_PARAMETER]);
        }
        queue.splice(index,1);
        reduceNotificationCount(notification);
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
        // If we have an id it means the notification is stored in the
        // mailbox service so we will delete it from the user's mail
        if (notification[VOYENT_MAIL_QUERY_PARAMETER]) {
            _removeNotificationFromMailbox(notification[VOYENT_MAIL_QUERY_PARAMETER]);
        }
        queue.splice(index,1);
        reduceNotificationCount(notification);
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
        return false; // Nothing to remove
    }
    let notification = queue[queuePosition];
    let cancelled = _fireEvent('beforeQueueUpdated',{"op":"del","notification":notification,"queue":queue.slice(0)},true);
    if (cancelled) {
        return false;
    }
    // Remove the notification from the queue
    queue.splice(queuePosition,1);
    queuePosition = -1;
    reduceNotificationCount(notification);
    _fireEvent('afterQueueUpdated',{"op":"del","notification":notification,"queue":queue.slice(0)},false);
    // Reset the selected property.
    // If we have an id it means the notification is stored in the
    // Mailbox service so we will delete it from the user's mail
    if (selected[VOYENT_MAIL_QUERY_PARAMETER]) {
        _removeNotificationFromMailbox(selected[VOYENT_MAIL_QUERY_PARAMETER]);
    }
    _unSelectNotification();
    return true;
};

/**
 * Removes all notifications from the notification queue and resets the queuePosition to -1.
 * @param {boolean} deleteFromMailbox - Specifies whether the notifications should be removed from the user's mailbox as well.
 */
export const clearNotificationQueue = function(deleteFromMailbox) {
    if (!queue || queue.length === 0) {
        return;
    }
    let cancelled = _fireEvent('beforeQueueUpdated',{"op":"clear","queue":queue.slice(0)},true);
    if (cancelled) {
        return;
    }
    if (deleteFromMailbox) {
        for (let i=0; i<queue.length; i++) {
            if (queue[i][VOYENT_MAIL_QUERY_PARAMETER]) {
                _removeNotificationFromMailbox(queue[i][VOYENT_MAIL_QUERY_PARAMETER]);
            }
        }
    }
    queue = [];
    queuePosition = -1;
    resetNotificationCounts();
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
    // Save the notification to inject in session storage so it survives the redirect
    selected = notification;
    _setSelectedNotificationInStorage();
    // Redirect browser
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
        // In some cases, such as when loading a notification from storage, the object may actually
        // be different than the one in the queue even though it refers to the same notification. In these
        // cases we will fallback to checking the nid on the notification to look for a match.
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
 * Unselects the currently selected notification.
 * @private
 */
const _unSelectNotification = function() {
    if (selected) {
        selected = null;
        _setSelectedNotificationInStorage();
        _fireEvent('notificationChanged', { notification: selected }, false);
        autoSelectNotification();
    }
};

/**
 * Displays the passed alert notification as a toast or browser native notification,
 * depending on the current configuration. Can be used to re-display a notification from
 * the queue or even to display a custom notification that is not part of the queue.
 * @param {object} notification - The notification to display.
 */
export const displayAlertNotification = function (notification) {
    // Abort if we don't have anything to display
    if (!notification || (!notification.detail && !notification.subject)) {
        return;
    }
    
    if (config.native.enabled && window.Notification && Notification.permission === 'granted') {
        _displayNativeNotification(notification);
    }
    else if (config.toast.enabled && config.toast.alert.enabled) {
        _displayToastNotification(notification, false);
    }
};

/**
 * Hide all visible notifications
 */
export const hideAllNotifications = function() {
    if (_queuedToasts) {
        _hideNotifications(_queuedToasts['bottom-left']);
        _hideNotifications(_queuedToasts['bottom-right']);
        _hideNotifications(_queuedToasts['top-left']);
        _hideNotifications(_queuedToasts['top-right']);
    }
    if (_displayedToasts) {
        _hideNotifications(_displayedToasts['bottom-left']);
        _hideNotifications(_displayedToasts['bottom-right']);
        _hideNotifications(_displayedToasts['top-left']);
        _hideNotifications(_displayedToasts['top-right']);
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
        if (notification.constructor === HTMLDivElement) { // Toast notification
            // Hide the toast via transform and opacity changes
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
            },400); // Transition effect is for 300ms so remove the toast from the DOM after 400ms
        }
        else if (notification.constructor === Notification) { // Native notification
            notification.close();
        }
    },typeof ms !== 'number' ? 0 : Math.round(ms));
};

//******************************************************************************************************************
//************************************************** PRIVATE API ***************************************************
//******************************************************************************************************************

/**
 * After the user is authenticated install the toast container and request native notification permissions.
 * mailboxes.
 * @private
 */
function _onAfterLogin() {
    if (!_isInitialized) {
        // Fire the initialization event if we are actively listening for notifications
        if (_listener) {
            _fireEvent('voyentNotifyInitialized',{"config":config},false);
            _isInitialized = true;
        }

        // Add a realm changed listener to manage the groups
        addRealmChangedListener();

        // Add our custom toast parent element to the page
        if (!document.getElementById(VOYENT_TOAST_CONTAINER_ID)) {
            _createToastContainer();
        }

        // Check for desktop notification support and request permission
        if (config.native.enabled && _isNewNotificationSupported()) {
            Notification.requestPermission(function(permission){});
        }
    }
}

/**
 * Add a listener that listens for realm changes via the `voyent-realm-changed`
 * event. When the realm changes we will leave all the current groups. It is
 * the app's responsibility to rejoin any groups it may have joined.
 * @private
 */
function addRealmChangedListener() {
    lastKnownRealm = getLastKnownRealm();
    window.addEventListener('voyent-realm-changed', function(e) {
        let newRealm = e.detail;
        if (typeof newRealm === 'string' && newRealm.trim().length &&
            typeof lastKnownRealm === 'string' && lastKnownRealm.trim().length &&
            lastKnownRealm !== newRealm) {
            leaveAllGroups();
        }
        lastKnownRealm = newRealm;
    });
}

/**
 * Leaves all groups that the user belongs to.
 * @private
 */
function leaveAllGroups() {
    if (groups && groups.length) {
        for (let i=0; i<groups.length; i++) {
            leavePassedGroup(groups[i]);
        }
    }
}

/**
 * Ensure we only have a single notification in the queue for a particular `nid`.
 * @param incomingNotification
 * @private
 */
function _removeDuplicateNotifications(incomingNotification) {
    if (incomingNotification.nid) {
        for (let i=queue.length-1; i>=0; i--) {
            let notificationInQueue = queue[i];
            // Check if we already have a notification in the queue matching the nid and remove it.
            // This may happen if the notification queue is refreshed just before the broadcast
            // is received. In this case we will remove the notification from the queue and let
            // the broadcast continue so the notification is always displayed to the user.
            if (notificationInQueue.nid === incomingNotification.nid) {
                reduceNotificationCount(notificationInQueue);
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
            return resolve(null);
        }
        // Don't fetch the alert if it's already in the list
        for (let i=0; i<alerts.length; i++) {
            if (alertId === alerts[i]._id) {
                return resolve(alerts[i]);
            }
        }
        // If we're already fetching the alert then skip fetching it again and pass the resolve
        // function so the original request for the alert can resolve it with the received alert
        if (queuedAlertPromises[alertId]) {
            queuedAlertPromises[alertId].push(resolve);
            return;
        }
        queuedAlertPromises[alertId] = [];

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
            // Resolve each queued `_addAlertToList` invocation that was triggered for the same alertId
            if (queuedAlertPromises[alertId]) {
                for (let i=0; i<queuedAlertPromises[alertId].length; i++) {
                    // A small delay so the notifications aren't all displayed simultaneously
                    setTimeout(function(queuedResolve) {
                        queuedResolve(alert);
                    }, 250, queuedAlertPromises[alertId][i]);
                }
                delete queuedAlertPromises[alertId];
             }
        }).catch(function(e) {
            console.error('Unable to retrieve alert JSON associated with notification', alertId, e);
            resolve(null);
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
    // Configure the notification options
    let opts = {};
    if (!config.useSubjectAsMessage && notification.detail && notification.detail.trim().length > 0) {
        opts.body = notification.detail;
    }

    if (typeof notification.badge === 'string' && notification.badge) {
        opts.icon = _getBadgeUrl(notification.badge);
    }
    // Display the notification
    let subject = notification.subject && notification.subject.trim().length > 0 ? notification.subject : '';
    let n = new Notification(subject,opts);
    // Add onclick listener with default behaviour of redirecting
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
    // Add onclose listener
    n.onclose = function() {
        _fireEvent('notificationClosed',{"notification":notification,"native":n},false);
    };
    // Add onshow listener for hiding the notifications after they are shown
    n.onshow = function() {
        _fireEvent('afterDisplayNotification',{"notification":notification,"native":n},false);
        // We use the onshow handler for hiding the notifications because in some browsers (like Chrome)
        // only three notifications are displayed at one time. If there are more than three notifications to show
        // then they will be queued in the background until they have room to be displayed. We only want to start
        // the hide timeout after they are actually shown on the page and not just added to the queue.
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
function _displayToastNotification(notification, isVoyentMsg) {
    if (!config.toast.enabled) {
        return;
    }
    
    // Default to bottom-right for messages if no setting is found
    let position = config.toast.position ? config.toast.position : 'bottom-right';
    if (!isVoyentMsg) {
        let cancelled = _fireEvent('beforeDisplayNotification',{"notification":notification},true);
        if (cancelled) {
            return;
        }
    }
    // Ensure we have the notification container in the DOM
    if (!document.getElementById(VOYENT_TOAST_CONTAINER_ID)) {
        _createToastContainer();
    }
    // Setup new div for toast notification
    let toast = document.createElement('div');
    toast.setAttribute('data-position',position);
    if (isVoyentMsg) {
        toast.setAttribute('data-is-message','data-is-message');
    }
    _createToastChildren(toast,notification);
    _setToastStyle(toast);
    // Add to DOM so we can determine the height of the notification
    document.getElementById(VOYENT_TOAST_CONTAINER_ID).appendChild(toast);
    // Display or queue the notification depending on the stack
    setTimeout(function() {
        // Display toast if there is room in the stack or there is no stack limit
        if ((config.toast.stackLimit > _displayedToasts[position].length) || config.toast.stackLimit <= 0) {
            _displayToast({"notification":notification,"toast":toast});
        }
        else {
            // Since we can't add to stack, add to queue
            _queuedToasts[position].push({"notification":notification,"toast":toast});
            if (config.toast.overwriteOld) {
                // Replace oldest notification
                hideNotification(_displayedToasts[position][0],0);
            }
        }
    },0);
}

/**
 * Setup a custom "long" toast notification that stays around for twice as long as the hideAfterMs value
 * @param notification - The notification to be displayed.
 * @param isVoyentMsg - Indicates whether this is a `message-info` or `message-error` notification.
 * @private
 */
function _displayLongToastNotification(notification,isVoyentMsg) {
    var hideMs = config.toast.hideAfterMs;
    var hideMsNative = config.native.hideAfterMs;
    
    config.toast.close.enabled = true;
    config.toast.hideAfterMs *= 2;
    config.native.hideAfterMs *= 2;
    
    _displayToastNotification(notification,isVoyentMsg);
    
    setTimeout(function() {
        config.toast.hideAfterMs = hideMs;
        config.native.hideAfterMs = hideMsNative;
    },1); // Need to order after the setTimeout used deeper in the notification toast
}

/**
 * Setup a custom "sticky" toast notification that never goes away and has a close button
 * @param notification - The notification to be displayed.
 * @param isVoyentMsg - Indicates whether this is a `message-info` or `message-error` notification.
 * @private
 */
function _displayStickyToastNotification(notification,isVoyentMsg) {
    var hideMs = config.toast.hideAfterMs;
    var hideMsNative = config.native.hideAfterMs;
    
    config.toast.close.enabled = true;
    config.toast.hideAfterMs = 0;
    config.native.hideAfterMs = 0;
    
    _displayToastNotification(notification,isVoyentMsg);
    
    setTimeout(function() {
        config.toast.hideAfterMs = hideMs;
        config.native.hideAfterMs = hideMsNative;
    },1); // Need to order after the setTimeout used deeper in the notification toast
}

/**
 * Displays a toast notification.
 * @param {Object} notificationData - An object containing a reference to the notification object and toast DOM element.
 */
function _displayToast(notificationData) {
    let position = notificationData.toast.getAttribute('data-position');
    // Determine the y position where the new toast should be displayed
    let yPosition = 0;
    for (let i=0; i<_displayedToasts[position].length; i++) {
        let height = _displayedToasts[position][i].offsetHeight;
        yPosition += height+config.toast.spacing;
        // Store height for later use if we haven't already set it
        if (!_displayedToasts[position][i].getAttribute('data-height')) {
            _displayedToasts[position][i].setAttribute('data-height',height.toString());
        }
    }
    // The y position will need to be negated if we are rendering the toast from the bottom of the page
    let trueYPosition = position.indexOf('bottom') > -1 ? (-Math.abs(yPosition)) : yPosition;
    notificationData.toast.style.opacity = 1;
    notificationData.toast.style.transform = 'translateY('+trueYPosition+'px)';
    notificationData.toast.style.webkitTransform = 'translateY('+trueYPosition+'px)';
    notificationData.toast.setAttribute('data-translate-y',yPosition.toString()); // Store absolute y position for later use
    // Store a reference to the toast
    _displayedToasts[position].push(notificationData.toast);
    // Remove the toast from the queue
    let index = _queuedToasts[position].indexOf(notificationData);
    if (index > -1) {
        _queuedToasts[position].splice(index,1);
    }
    // Hide the notification after set timeout
    if (config.toast.hideAfterMs > 0) {
        hideNotification(notificationData.toast,config.toast.hideAfterMs);
    }
    if (!notificationData.toast.getAttribute('data-is-message')) {
        _fireEvent('afterDisplayNotification',{"notification":notificationData.notification,"toast":notificationData.toast},false);
    }
}

/**
 * Loop through the passed list of notifications and hide them
 * This is meant to be used in concert with _displayedToasts and _queuedToasts
 * @param {Array} list - The list of notifications to hide
 * @private
 */
function _hideNotifications(list) {
    if (list && list.length > 0) {
        for (var hideLoop = 0; hideLoop < list.length; hideLoop++) {
            hideNotification(list[hideLoop],0);
        }
    }
}

/**
 * Handles sliding notifications in the stack up or down as notifications are removed from the stack.
 * @param {Object} toast - The toast DOM element that was just removed from the stack.
 * @private
 */
function _updateDisplayedNotifications(toast) {
    // Check if we need to slide any notifications up, if the last notification
    // closed was in the last position then we don't need to slide
    let position = toast.getAttribute('data-position');
    let index = _displayedToasts[position].indexOf(toast);
    if (index > -1 && index !== _displayedToasts[position].length-1) {
        let isBottom = position.indexOf('bottom') > -1;
        // Slide all notifications after the one that is being removed
        for (let i=index+1; i<_displayedToasts[position].length; i++) {
            let toastToSlide = _displayedToasts[position][i];
            let yPosition;
            // Account for spacing between toasts
            let paddingMultiplier = index === 0 ? 1 : index;
            let padding = config.toast.spacing * paddingMultiplier;
            if (isBottom) { // Slide down
                yPosition = -parseInt(toastToSlide.getAttribute('data-translate-y')) +
                            parseInt(toast.getAttribute('data-height')) + padding;
            }
            else { // Slide up
                yPosition = parseInt(toastToSlide.getAttribute('data-translate-y')) -
                            parseInt(toast.getAttribute('data-height')) - padding;
            }
            toastToSlide.style.transform = 'translateY('+yPosition+'px)';
            toastToSlide.style.webkitTransform = 'translateY('+yPosition+'px)';
            // Always store the y position as a positive number since moving
            // away from `top` and `bottom` is always a positive number
            toastToSlide.setAttribute('data-translate-y',Math.abs(yPosition));
        }
    }
    // Keep the list of displayed toasts in sync
    let toastIndex = _displayedToasts[position].indexOf(toast);
    if (toastIndex > -1) {
        _displayedToasts[position].splice(toastIndex,1);
    }
    // Display the next notification in the queue
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
    // Add close button, if enabled
    if (config.toast.close.enabled) {
        let closeDiv = document.createElement('div');
        closeDiv.className = 'close';
        closeDiv.style.float = 'right';
        closeDiv.style.fontSize = '15px';
        closeDiv.style.color = '#f1f1f1';
        closeDiv.style.cursor = 'pointer';
        closeDiv.style.marginTop = '-10px';
        closeDiv.style.marginBottom = '-10px';
        // Append user's custom styling
        closeDiv.setAttribute('style',closeDiv.getAttribute('style')+config.toast.close.style);
        // Add X character
        closeDiv.innerHTML = '&#10006;';
        // Add onclick listener with default behaviour of closing the notification, don't support events for voyent messages
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

        // Clear float
        let clearClose = document.createElement('div');
        clearClose.style.clear = 'both';
        toast.appendChild(clearClose);
    }
    // Add badge, if provided
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
    // Add subject, if provided
    if (notification.subject && notification.subject.trim().length > 0 && !config.useSubjectAsMessage) {
        let titleDiv = document.createElement('div');
        titleDiv.className = 'subject';
        titleDiv.style.fontSize = '16px';
        titleDiv.style.marginBottom = '5px';
        titleDiv.innerHTML = notification.subject;
        toast.appendChild(titleDiv);
    }

    // Add message
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

    // Add onclick listener with default behaviour of redirecting, don't support events for voyent messages
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

    // Add clear float
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
    // Default styling
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
    // Styling specific to the position configuration
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
            // Default to top-right
            toast.style.right = '0';
            toast.style.top = '0';
            toast.style.transform = 'translateY('+(-Math.abs(TOAST_Y_POS))+'px)';
            toast.style.webkitTransform = 'translateY('+(-Math.abs(TOAST_Y_POS))+'px)';
    }
    // Append user's custom styling
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
                // Build the selector
                let selector = 'data-selected-' + (keys.length ? keys.join('-') + '-' + key : key);
                // Find all matching DOM elements
                elements = document.querySelectorAll('['+selector+']');
                // Inject the data for each element
                for (i=0; i<elements.length; i++) {
                    val = (selector === 'data-selected-time') ? new Date(val) : val;
                    _injectOrClearDataForType(elements[i],val,doClear);
                }
            }
            else {
                // We may need to inject sub properties of this object
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
            // Set the input value
            element.value = doClear ? '' : data;
            break;
        case 'SELECT':
            // Only proceed if we have an actual Array
            if (!Array.isArray(data)) {
                return;
            }
            // Always clear out the select of any old options
            element.value = '';
            while (element.options.length) { element.remove(0); }
            if (doClear) {
                // Nothing else to do
                return;
            }
            for (let i=0; i<data.length; i++) {
                // Generate select options for array elements
                let opt = document.createElement("option");
                // Support objects with value and label properties
                opt.value = data[i].value || data[i];
                opt.textContent = data[i].label || data[i];
                element.appendChild(opt);
            }
            break;
        default:
            // For all other cases just set the text content of the element
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
    // Special case below for Android Chrome since it doesn't currently support non-persistent notifications
    // https://bugs.chromium.org/p/chromium/issues/detail?id=481856
    // Eventually it would be nice to support persistent (ServiceWorkerRegistration) Notifications
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
    // If we have an id then this means the notification is
    // also stored in the mailbox service so we will delete it
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
    // Loop backwards through the queue since it's most
    // likely any duplicate notifications were just added
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

// Setup message info and error listeners
window.addEventListener('message-info',function(e) {
    if (!config.toast.message.enabled) {
        return;
    }
        
    if (typeof e.detail === 'string' && e.detail.trim()) {
        console.log('message-info:',e.detail);
        config.toast.close.enabled = false;
        _displayToastNotification({"subject":e.detail},true);
    }
});
window.addEventListener('message-info-long',function(e) {
    if (!config.toast.message.enabled) {
        return;
    }
        
    if (typeof e.detail === 'string' && e.detail.trim()) {
        console.log('message-info-long:',e.detail);
        _displayLongToastNotification({"subject":e.detail},true);
    }
});
window.addEventListener('message-info-sticky',function(e) {
    if (!config.toast.message.enabled) {
        return;
    }
        
    if (typeof e.detail === 'string' && e.detail.trim()) {
        console.log('message-info-sticky:',e.detail);
        _displayStickyToastNotification({"subject":e.detail},true);
    }
});
window.addEventListener('message-success',function(e) {
    if (!config.toast.message.enabled) {
        return;
    }
    
    if (typeof e.detail === 'string' && e.detail.trim()) {
        let style = config.toast.style;
        config.toast.style = style + 'background-color:#008000;';
        config.toast.close.enabled = false;
        console.log('message-success:',e.detail);
        _displayToastNotification({"subject":e.detail},true);
        config.toast.style = style;
    }
});                                     
window.addEventListener('message-warn',function(e) {
    if (!config.toast.message.enabled) {
        return;
    }
    
    if (typeof e.detail === 'string' && e.detail.trim()) {
        let style = config.toast.style;                       
        config.toast.style = style + 'background-color:#FF7900;';
        config.toast.close.enabled = false;
        console.warn('message-warn:',e.detail);
        _displayToastNotification({"subject":e.detail},true);
        config.toast.style = style;
    }
});
window.addEventListener('message-warn-long',function(e) {
    if (!config.toast.message.enabled) {
        return;
    }
    
    if (typeof e.detail === 'string' && e.detail.trim()) {
        let style = config.toast.style;
        config.toast.style = style + 'background-color:#FF7900;';
        console.error('message-warn-long:',e.detail);
        _displayLongToastNotification({"subject":e.detail},true);
        config.toast.style = style;
    }
});
window.addEventListener('message-warn-sticky',function(e) {
    if (!config.toast.message.enabled) {
        return;
    }
    
    if (typeof e.detail === 'string' && e.detail.trim()) {
        let style = config.toast.style;
        config.toast.style = style + 'background-color:#FF7900;';
        console.error('message-warn-sticky:',e.detail);
        _displayStickyToastNotification({"subject":e.detail},true);
        config.toast.style = style;
    }
});
window.addEventListener('message-error',function(e) {
    if (!config.toast.message.enabled) {
        return;
    }
    
    if (typeof e.detail === 'string' && e.detail.trim()) {
        let style = config.toast.style;
        config.toast.style = style + 'background-color:#C70000;';
        config.toast.close.enabled = false;
        console.error('message-error:',e.detail);
        _displayToastNotification({"subject":e.detail},true);
        config.toast.style = style;
    }
});
window.addEventListener('message-error-long',function(e) {
    if (!config.toast.message.enabled) {
        return;
    }
    
    if (typeof e.detail === 'string' && e.detail.trim()) {
        let style = config.toast.style;
        config.toast.style = style + 'background-color:#C70000;';
        console.error('message-error-long:',e.detail);
        _displayLongToastNotification({"subject":e.detail},true);
        config.toast.style = style;
    }
});
window.addEventListener('message-error-sticky',function(e) {
    if (!config.toast.message.enabled) {
        return;
    }
    
    if (typeof e.detail === 'string' && e.detail.trim()) {
        let style = config.toast.style;
        config.toast.style = style + 'background-color:#C70000;';
        console.error('message-error-sticky:',e.detail);
        _displayStickyToastNotification({"subject":e.detail},true);
        config.toast.style = style;
    }
});
