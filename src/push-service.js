function PushService(v, utils) {
    function validateRequiredGroup(params, reject) {
        utils.validateParameter('group', 'The group parameter is required', params, reject);
    }

    function validateRequiredCallback(params, reject) {
        utils.validateParameter('group', 'The callback parameter is required', params, reject);
    }

    var pushKeys = {
        PUSH_CALLBACKS_KEY: 'pushCallbacks'
    };

    function storePushListener(pushId, group, cb) {
        var pushListeners = {};
        var pushListenersStr = utils.getSessionStorageItem(pushKeys.PUSH_CALLBACKS_KEY);
        if (pushListenersStr) {
            try {
                pushListeners = JSON.parse(pushListenersStr);
            } catch (e) {
            }
        }
        if (!pushListeners[group]) {
            pushListeners[group] = [];
        }
        pushListeners[group].push({pushId: pushId, callback: cb});
        utils.setSessionStorageItem(pushKeys.PUSH_CALLBACKS_KEY, JSON.stringify(pushListeners));
    }

    return {

        /**
         * Connect to the Voyent Push Service
         *
         * @alias startPushService
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name will be used.
         * @param {String} params.cloudPushURI If provided, Cloud Push notifications will be enabled.
         */
        startPushService: function (params) {

            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var pushURL = (params.ssl ? 'https://' : 'http://') + v.pushURL + '/';

                    function notifyBack() {
                        if (params.cloudPushURI) {
                            window.ice.push.addNotifyBackURI(params.cloudPushURI, resolve);
                        } else {
                            resolve();
                        }
                    }
                    //make sure the ICEpush code is evaluated before this
                    window.ice.push = ice.setupPush({
                        'uri': pushURL,
                        'account': account,
                        'realm': realm,
                        'access_token': token
                    }, notifyBack);

                    console.log('voyent.push.connect() connected');
                }
            );
        },


        /**
         * Add listener for notifications belonging to the specified group.
         * Callbacks must be passed by name to receive cloud push notifications.
         *
         * @alias addPushListener
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name will be used.
         * @param {String} params.group The push group name
         * @param {String} params.callback The callback function to be called on the push event
         */
        addPushListener: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                validateRequiredGroup(params, reject);
                validateRequiredCallback(params, reject);

                if (ice && ice.push) {
                    ice.push.createPushId(function (pushId) {
                        ice.push.addGroupMember(params.group, pushId, true, function() {
                            var fn = utils.findFunctionInGlobalScope(params.callback);
                            if (!fn) {
                                reject('could not find function in global scope: ' + params.callback);
                            } else {
                                ice.push.register([pushId], fn);
                                storePushListener(pushId, params.group, params.callback);
                                resolve();
                            }
                        });
                    });
                    console.log('voyent.push.addPushListener() added listener to group ' + params.group);
                } else {
                    reject('Push service is not active');
                }
            });
        },

        /**
         * Remove listener for notifications belonging to the specified group.
         * Callbacks must be passed by name to receive cloud push notifications.
         *
         * @alias removePushListener
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name will be used.
         * @param {String} params.group The push group name
         * @param {String} params.callback The callback function to be called on the push event. This parameter is optional, when missing
         * all callbacks within the group are removed.
         */
        removePushListener: function (params) {
            return new Promise(function (resolve, reject) {
                console.log('voyent.push.removePushListener() group: ' + params.group);
                params = params ? params : {};
                v.checkHost(params);
                validateRequiredGroup(params, reject);
                var pushListenersStr = utils.getSessionStorageItem(pushKeys.PUSH_CALLBACKS_KEY);
                if (!pushListenersStr) {
                    console.error('Cannot remove push listener ' + params.group + ', missing push listener storage.');
                    reject('Cannot remove push listener ' + params.group + ', missing push listener storage.');
                }
                else {
                    try {
                        var pushListenerStorage = JSON.parse(pushListenersStr);
                        var listeners = pushListenerStorage[params.group];
                        console.log('found push listeners in storage: ' + ( listeners ? JSON.stringify(listeners) : null ));
                        if (!listeners) {
                            console.error('could not find listeners for group ' + params.group);
                            reject('could not find listeners for group ' + params.group);
                            return;
                        }
                        if (params.callback) {
                            //remove only the listener/pushId corresponding to the provided callback
                            var remainingListeners = [];
                            for (var i = 0; i < listeners.length; i++) {
                                var listener = listeners[i];
                                if (listener.callback == params.callback) {
                                    var pushId = listener.pushId;
                                    ice.push.removeGroupMember(params.group, pushId);
                                    ice.push.deregister(pushId);
                                    console.log('removed push id ' + pushId);
                                } else {
                                    remainingListeners.push(listener);
                                }

                                if (remainingListeners.length > 0) {
                                    pushListenerStorage[params.group] = remainingListeners;
                                } else {
                                    delete pushListenerStorage[params.group];
                                }
                            }
                        } else {
                            //remove all the listeners for the group
                            for (var i = 0; i < listeners.length; i++) {
                                var pushId = listeners[i].pushId;
                                ice.push.removeGroupMember(params.group, pushId);
                                ice.push.deregister(pushId);
                                console.log('removed push id ' + pushId);
                            }
                            delete pushListenerStorage[params.group];
                        }
                        utils.setSessionStorageItem(pushKeys.PUSH_CALLBACKS_KEY, JSON.stringify(pushListenerStorage));
                        resolve();
                    } catch (e) {
                        console.error(e);
                        reject(e);
                    }
                }

            });
        },

        /**
         * Push notification to a push group.
         *
         * This will result in an Ajax Push (and associated callback)
         * to any web pages that have added a push listener to the
         * specified group.  If Cloud Push options are provided
         * (params.subject and params.detail) a Cloud Push will
         * be dispatched as a home screen notification to any devices
         * unable to recieve the Ajax Push via the web page.
         *
         * @alias sendPushEvent
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name will be used.
         * @param {String} params.group The push group name
         * @param {String} params.message The message is the push notification configuration
         *
         * @example
         * sendPushEvent({
         *      account: "<account>",
         *      realm: "<realm>",
         *      group: "<group>",
         *      message: {
         *           "cloud_notification_forced": <boolean>,
         *           "global": {
         *              "detail": "<detail-string>",
         *               "expire_time": <long>,
         *               "icon": "<url-string>",
         *               "payload": {},
         *               "priority": "<string>",
         *               "subject": "<subject-string>",
         *               "url": "<url-string>"
         *           },
         *           "cloud": {
         *               "detail": "<detail-string>",
         *               "expire_time": <long>,
         *               "icon": "<url-string>",
         *               "payload": {},
         *               "priority": "<string>",
         *               "subject": "<subject-string>",
         *               "url": "<url-string>"
         *           }
         *       }
         * });
         */
        sendPushEvent: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    validateRequiredGroup(params, reject);

                    if (ice && ice.push) {
                        ice.push.notify(params.group, params.message);
                        resolve();
                    } else {
                        reject('Push service is not active');
                    }
                }
            );
        }
    };
}
