function BroadcastService(v, utils) {
    var portMatcher = /\:(\d+)/;

    function ioURL() {
        var url;
        if (portMatcher.test(v.baseURL)) {
            url = v.baseURL.replace(portMatcher, ':443');
        } else if (v.baseURL[v.baseURL.length - 1] == '/') {
            url = v.baseURL.substring(0, v.baseURL.length - 1) + ':443';
        } else {
            url = v.baseURL + ':443';
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

    var groupsToCallbacks = new Map();
    var socket;
    return {
        resumeBroadcastReception: function resumeBroadcastReception() {
            if (socket && socket.disconnected) {
                socket.open();
            } else {
                console.warn('broadcast-legacy: Broadcast reception is already on.');
            }
        },

        pauseBroadcastReception: function pauseBroadcastReception() {
            if (socket && socket.connected) {
                socket.close();
            } else {
                console.warn('broadcast-legacy: Broadcast reception is already off.');
            }
        },

        startListening: function startListening(params) {
            if (!socket) {
                var socketManager = io.Manager(ioURL(), {
                    // Default to websocket connection but fallback to polling.
                    transports: ['websocket', 'polling'],
                    // If previously connected via websocket then try websocket immediately again if disconnected.
                    rememberUpgrade: true,
                    // Always try to reconnect automatically.
                    reconnection: true,
                    // Never stop trying to reconnect.
                    reconnectionAttempts: Infinity,
                    // Wait 3 seconds between reconnection attempts.
                    reconnectionDelay: 3000,
                    // Wait a maximum of 3 seconds between reconnection attempts. Irrelevant since `randomizationFactor` is 0.
                    reconnectionDelayMax: 3000,
                    // The factor to alter the `reconnectionDelay` by. Use 0 so we always try to reconnect exactly every 3 seconds.
                    randomizationFactor: 0,
                    // Wait 10 seconds for the connection to be established before aborting and retrying the connection.
                    timeout: 10000
                });
                socket = socketManager.socket('/');
                socket.on('connect', function() {
                    console.info('broadcast-legacy: Connection established.');
                });
                socket.on('connect_error', function(error) {
                    console.error('broadcast-legacy: Connection failed:', error);
                });
                socket.on('reconnect', function(attempt) {
                    console.info('broadcast-legacy: Reconnected on attempt #' + attempt + '.');
                });
                socket.on('reconnect_attempt', function() {
                    console.info('broadcast-legacy: Retrying connection.');
                });
                socket.on('reconnect_failed', function() {
                    console.warn('broadcast-legacy: Failed to reconnect.');
                });
                socket.on('connect_timeout', function(timeout) {
                    console.info('broadcast-legacy: Connection timed out after ' + timeout + 'ms.');
                });
                socket.on('disconnect', function(reason) {
                    console.warn('broadcast-legacy: Disconnected because:', reason);
                });
                socket.on('broadcast-event', function(message) {
                    var callbacks = groupsToCallbacks.get(message.group);
                    if (callbacks) {
                        callbacks.forEach(function (c) {
                            try {
                                c(message.payload);
                            } catch (ex) {
                                console.error('broadcast-legacy: Failed to invoke callback ' + c);
                            }
                        });
                    }
                });
            }

            return new Promise(
                function (resolve, reject) {
                    validateRequiredGroup(params, reject);
                    validateRequiredCallback(params, reject);

                    try {
                        var group = params.group;
                        //once connected let the server know that we want to use/create this group
                        if (socket.connected) {
                            socket.emit('group', group);
                        } else {
                            socket.on('connect', function () {
                                socket.emit('group', group);
                            });
                        }

                        var callbacks = groupsToCallbacks.get(group);
                        if (!callbacks) {
                            callbacks = [];
                            groupsToCallbacks.set(group, callbacks);
                        }
                        callbacks.push(params.callback);
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
                            if (params.callback) {
                                var callbacks = groupsToCallbacks.get(params.group);
                                if (callbacks) {
                                    callbacks.pop(params.callback)
                                }
                            } else {
                                groupsToCallbacks.delete(params.group);
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
