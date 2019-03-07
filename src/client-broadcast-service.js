function BroadcastService(v, utils) {
    var portMatcher = /\:(\d+)/;

    function ioURL() {
        var url;
        if (portMatcher.test(v.baseURL)) {
            url = v.baseURL.replace(portMatcher, ':3000');
        } else if (v.baseURL[v.baseURL.length - 1] == '/') {
            url = v.baseURL.substring(0, v.baseURL.length - 1) + ':3000';
        } else {
            url = v.baseURL + ':3000';
        }

        return url;
    }

    function validateRequiredGroup(params, reject) {
        utils.validateParameter('group', 'The group parameter is required', params, reject);
    }

    function validateRequiredCallback(params, reject) {
        utils.validateParameter('callback', 'The callback parameter is required', params, reject);
    }

    function validateRequiredMessage(params, reject) {
        utils.validateParameter('message', 'The callback parameter is required', params, reject);
    }

    var callbacksToSockets = [];
    var groupsToCallbacks = [];
    var socketManager;
    return {
        startListening: function startListening(params) {
            if (!socketManager) {
                socketManager = io.Manager(ioURL(), {
                    transports: ['polling'],
                    reconnectionAttempts: 3,
                    rememberUpgrade: true
                });
                console.log('Created socket manager.');
            }

            return new Promise(
                function (resolve, reject) {
                    validateRequiredGroup(params, reject);
                    validateRequiredCallback(params, reject);

                    try {
                        var group = params.group;
                        var socket = socketManager.socket('/');
                        socket.on('connect_error', function(error) {
                            console.warn('Connection failed: ' + error);
                        });
                        socket.on('reconnect_attempt', function() {
                            console.info('Retrying to connect.');
                        });
                        socket.on('reconnect_failed', function() {
                            console.warn('Failed to reconnect.');
                        });
                        socket.on('connect_timeout', function(timeout) {
                            console.info('Connection timed out after ' + timeout + ' seconds.');
                        });
                        //once connected let the server know that we want to use/create this room
                        socket.on('connect', function() {
                            socket.emit('room', group);
                        });

                        groupsToCallbacks.push({'group': group, 'callback': params.callback});
                        //save callback mapping
                        callbacksToSockets.push({'callback': params.callback, 'socket': socket});

                        socket.on('broadcast-event', function(message) {
                            params.callback(JSON.parse(message));
                        });
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                }
            );
        },

        stopListening: function stopListening(params) {
            return new Promise(
                function (resolve, reject) {
                    try {
                        if (params.group) {
                            var remainingGroupsToCallbacks = [];
                            for (var i = 0, l = groupsToCallbacks.length; i < l; i++) {
                                var groupToCallback = groupsToCallbacks[i];
                                if (groupToCallback.group == params.group) {
                                    var remainingCallbacksToSockets = [];
                                    for (var j = 0, lcs = callbacksToSockets.length; j < lcs; j++) {
                                        var callbackToSocket = callbacksToSockets[j];
                                        if (callbackToSocket.callback == groupToCallback.callback) {
                                            try {
                                                callbackToSocket.socket.disconnect();
                                            } catch (ex) {
                                                //failed to disconnect socket...continue
                                            }
                                        } else {
                                            remainingCallbacksToSockets.push(callbackToSocket);
                                        }
                                    }
                                    callbacksToSockets = remainingCallbacksToSockets;
                                } else {
                                    remainingGroupsToCallbacks.push(groupToCallback);
                                }
                            }
                            groupsToCallbacks = remainingGroupsToCallbacks;
                        }

                        if (params.callback) {
                            var remainingCallbacksToSockets = [];
                            for (var j = 0, lcs = callbacksToSockets.length; j < lcs; j++) {
                                var callbackToSocket = callbacksToSockets[j];
                                if (callbackToSocket.callback == params.callback) {
                                    callbackToSocket.socket.disconnect();
                                } else {
                                    remainingCallbacksToSockets.push(callbackToSocket);
                                }
                                callbacksToSockets = remainingCallbacksToSockets;
                            }

                            var remainingGroupsToCallbacks = [];
                            for (var i = 0, l = groupsToCallbacks.length; i < l; i++) {
                                var groupToCallback = groupsToCallbacks[i];
                                if (groupToCallback.callback != params.callback) {
                                    remainingGroupsToCallbacks.push(groupToCallback);
                                }
                            }
                        }

                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                }
            );
        },

        broadcast: function broadcast(params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    validateRequiredGroup(params, reject);
                    validateRequiredMessage(params, reject);

                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.broadcastURL, account, realm, '', token);

                    v.$.post(url, params).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        }
    };
}