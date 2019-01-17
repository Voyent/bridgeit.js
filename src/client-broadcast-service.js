function BroadcastService(v, utils) {
    var broadcastURL = v.baseURL + '/broadcast';
    var portMatcher = /\:(\d+)/;
    var ioURL;
    if (portMatcher.test(v.baseURL)) {
        ioURL = v.baseURL.replace(portMatcher, ':3000');
    } else if (v.baseURL[v.baseURL.length - 1] == '/') {
        ioURL = v.baseURL.substring(0, v.baseURL.length - 1) + ':3000';
    } else {
        ioURL = v.baseURL + ':3000';
    }

    ioURL = ioURL.replace('https', 'http');

    function validateRequiredGroup(params, reject) {
        utils.validateParameter('group', 'The group parameter is required', params, reject);
    }

    function validateRequiredCallback(params, reject) {
        utils.validateParameter('callback', 'The callback parameter is required', params, reject);
    }

    function validateRequiredMessage(params, reject) {
        utils.validateParameter('message', 'The callback parameter is required', params, reject);
    }

    var io = require('socket.io-client');
    var map = require('collections/map');

    var callbacksToSockets = map();
    var groupsToCallbacks = map();

    return {
        startListening: function startListening(params) {
            return new Promise(
                function (resolve, reject) {
                    validateRequiredGroup(params, reject);
                    validateRequiredCallback(params, reject);

                    try {
                        var group = params.group;
                        var socket = io(ioURL + '/' + group, {
                            transports: ['websocket']//, path: '/io'
                        });

                        //save group mapping
                        var callbacks = groupsToCallbacks.get(group);
                        if (!callbacks) {
                            callbacks = [];
                        }
                        callbacks.push(params.callback)
                        groupsToCallbacks.set(group, callbacks);
                        //save callback mapping
                        callbacksToSockets.set(params.callback, socket);

                        socket.on('broadcast-event', params.callback);
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
                            var callbacks = groupsToCallbacks.get(params.group);
                            if (callbacks) {
                                for (var i = 0, l = callbacks.length; i < l; i++) {
                                    var c = callbacks[i];
                                    var sock = callbacksToSockets.get(c);
                                    if (sock) {
                                        sock.disconnect();
                                    }
                                }
                                for (var i = 0, l = callbacks.length; i < l; i++) {
                                    var c = callbacks[i];
                                    callbacksToSockets.delete(c);
                                }
                            }
                        }

                        if (params.callback) {
                            var sock = callbacksToSockets.get(params.callback);
                            if (sock) {
                                sock.disconnect();
                                callbacksToSockets.delete(params.callback);
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

                    var url = utils.getRealmResourceURL(broadcastURL, account, realm, '', token);

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