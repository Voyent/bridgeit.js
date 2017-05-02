function PushService(b, utils) {
    function validateRequiredGroup(params, reject){
        utils.validateParameter('group', 'The group parameter is required', params, reject);
    }

    function validateRequiredCallback(params, reject){
        utils.validateParameter('group', 'The callback parameter is required', params, reject);
    }

    var PUSH_CALLBACKS = 'pushCallbacks';
    var CLOUD_CALLBACKS_KEY = "bridgeit.cloudcallbacks";
    var services = b.io;

    function storePushListener(pushId, group, cb){
        var pushListeners = {};
        var pushListenersStr = utils.getSessionStorageItem(PUSH_CALLBACKS);
        if( pushListenersStr ){
            try{
                pushListeners = JSON.parse(pushListenersStr);
            }
            catch(e){}
        }
        if( !pushListeners[group] ){
            pushListeners[group] = [];
        }
        pushListeners[group].push({pushId: pushId, callback: cb});
        utils.setSessionStorageItem(PUSH_CALLBACKS, JSON.stringify(pushListeners));
    }

    function addCloudPushListener(){
        var callback = utils.findFunctionInGlobalScope(params.callback);
        if( !callback ){
            reject('BridgeIt Cloud Push callbacks must be in window scope. Please pass either a reference to or a name of a global function.');
        }
        else{
            var callbacks = utils.getLocalStorageItem(CLOUD_CALLBACKS_KEY);
            var callbackName = utils.getFunctionName(callback);
            if (!callbacks)  {
                callbacks = " ";
            }
            if (callbacks.indexOf(" " + callbackName + " ") < 0)  {
                callbacks += callbackName + " ";
            }
            utils.setLocalStorageItem(CLOUD_CALLBACKS_KEY, callbacks);
        }
    }

    function addPushGroupMember(){
        ice.push.createPushId(function(pushId) {
            ice.push.addGroupMember(params.group, pushId);
            var fn = utils.findFunctionInGlobalScope(params.callback);
            if( !fn ){
                reject('could not find function in global scope: ' + params.callback);
            }
            else{
                ice.push.register([ pushId ], fn);
                storePushListener(pushId, params.group, params.callback);
                if( params.useCloudPush ){
                    addCloudPushListener();
                }
            }
        });
    }

    return {

        /**
         * Connect to the BridgeIt Push Service
         *
         * @alias startPushService
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         */
        startPushService: function(params){

            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var pushURL = (params.ssl ? 'https://' : 'http://') + services.pushURL + '/';

                    //make sure the ICEpush code is evaluated before this
                    window.ice.push = ice.setupPush({
                        'uri': pushURL,
                        'account': account,
                        'realm': realm,
                        'access_token': token
                    });

                    console.log('bridgeit.io.push.connect() connected');
                    resolve();
                }
            );
        },


        /**
         * Add listener for notifications belonging to the specified group.
         * Callbacks must be passed by name to receive cloud push notifications.
         *
         * @alias addPushListener
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.group The push group name
         * @param {String} params.callback The callback function to be called on the push event
         * @param {Boolean} params.useCloudPush Use BridgeIt Cloud Push to call the callback through native cloud notification channels when necessary (default true)
         */
        addPushListener: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                services.checkHost(params);

                validateRequiredGroup(params, reject);
                validateRequiredCallback(params, reject);

                if( !('useCloudPush' in params )){
                    params.useCloudPush = true;
                }

                if (ice && ice.push) {
                    addPushGroupMember();
                    console.log('bridgeit.io.push.addPushListener() added listener ' +
                        params.callback + ' to group ' + params.group);
                    resolve();
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
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.group The push group name
         * @param {String} params.callback The callback function to be called on the push event. This parameter is optional, when missing
         * all callbacks within the group are removed.
         */
        removePushListener: function(params){
            return new Promise(function(resolve, reject) {
                console.log('bridgeit.io.push.removePushListener() group: ' + params.group);
                params = params ? params : {};
                services.checkHost(params);
                validateRequiredGroup(params, reject);
                var pushListenersStr = utils.getSessionStorageItem(PUSH_CALLBACKS);
                if( !pushListenersStr ){
                    console.error('Cannot remove push listener ' + params.group + ', missing push listener storage.');
                }
                else{
                    try {
                        var pushListenerStorage = JSON.parse(pushListenersStr);
                        var listeners = pushListenerStorage[params.group];
                        console.log('found push listeners in storage: ' + ( listeners ? JSON.stringify(listeners) : null ) );
                        if( !listeners ){
                            console.error('could not find listeners for group ' + params.group);
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
                        utils.setSessionStorageItem(PUSH_CALLBACKS, JSON.stringify(pushListenerStorage));
                    } catch(e){
                        console.error(e);
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
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.group The push group name
         * @param {String} params.subject The subject heading for the notification
         * @param {String} params.detail The message text to be sent in the notification body
         */
        sendPushEvent: function(params) {
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    validateRequiredGroup(params, reject);

                    if (ice && ice.push) {
                        var post = {};
                        if( params.subject ){
                            post.subject = params.subject;
                        }
                        if( params.detail ){
                            post.detail = params.detail;
                        }
                        ice.push.notify(params.group, post);
                        resolve();
                    } else {
                        reject('Push service is not active');
                    }
                }
            );
        }
    };
}
