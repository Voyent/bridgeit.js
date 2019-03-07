import * as utils from './private-utils'
import io from 'socket.io-client'
import { baseURL, post } from "./public-utils";
import { updateLastActiveTimestamp } from "./auth-service";

const broadcastURL = baseURL + '/broadcast';
const portMatcher = /\:(\d+)/;

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


let callbacksToSockets = new Map();
let groupsToCallbacks = new Map();
let socketManager;
export function startListening(params) {
    if (!socketManager) {
        socketManager = io.Manager(ioURL(), {
            transports: ['websocket', 'polling'],
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
                let group = params.group;
                let socket = socketManager.socket('/');
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

                //save group mapping
                let callbacks = groupsToCallbacks.get(group);
                if (!callbacks) {
                    callbacks= [];
                }
                callbacks.push(params.callback);
                groupsToCallbacks.set(group, callbacks);
                //save callback mapping
                callbacksToSockets.set(params.callback, socket);

                socket.on('broadcast-event', function(message) {
                    params.callback(JSON.parse(message));
                });
                resolve();
            } catch (e) {
                reject(e);
            }
        }
    );
}

export function stopListening(params) {
    return new Promise(
        function (resolve, reject) {
            try {
                if (params.group) {
                    let callbacks = groupsToCallbacks.get(params.group);
                    if (callbacks) {
                        for (let i = 0, l = callbacks.length; i < l; i++) {
                            let c = callbacks[i];
                            let sock = callbacksToSockets.get(c);
                            if (sock) {
                                sock.disconnect();
                            }
                        }
                        for (let i = 0, l = callbacks.length; i < l; i++) {
                            let c = callbacks[i];
                            callbacksToSockets.delete(c);
                        }
                    }
                }

                if (params.callback) {
                    let sock = callbacksToSockets.get(params.callback);
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
}

export function broadcast(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            validateRequiredGroup(params, reject);
            validateRequiredMessage(params, reject);

            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(broadcastURL, account, realm, '', token);

            post(url, params).then(function () {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}