import * as utils from './private-utils'
import io from 'socket.io-client'
import { baseURL, post } from "./public-utils";
import { updateLastActiveTimestamp } from "./auth-service";

const broadcastURL = baseURL + '/broadcast';
const portMatcher = /\:(\d+)/;

function ioURL() {
    var url;
    if (portMatcher.test(baseURL)) {
        url = baseURL.replace(portMatcher, ':443');
    } else if (baseURL[baseURL.length - 1] == '/') {
        url = baseURL.substring(0, baseURL.length - 1) + ':443';
    } else {
        url = baseURL + ':443';
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

let groupsToCallbacks = new Map();
let socket;
export function startListening(params) {
    if (!socket) {
        let socketManager = io.Manager(ioURL(), {
            // Default to websocket connection but fallback to polling.
            transports: ['websocket', 'polling'],
            // If previously connected via websocket then try websocket immediately again if disconnected.
            rememberUpgrade: true,
            // Always try to reconnect automatically.
            reconnection: true,
            // Never stop trying to reconnect.
            reconnectionAttempts: Infinity,
            // Wait 3 seconds before the initial reconnection attempt. Each attempt increases
            // the reconnection delay by 2x along with +/- the `randomizationFactor`.
            reconnectionDelay: 3000,
            // Wait a maximum of 1 minute between reconnection attempts.
            reconnectionDelayMax: 60000,
            // The +/- factor to alter the `reconnectionDelay` by. For example, the first
            // reconnection will be between 2500ms and 7500ms (5000*0.5 to 5000*1.5).
            randomizationFactor: 0.5,
            // Wait 10 seconds for the connection to be established before aborting and retrying the connection.
            timeout: 10000
        });
        socket = socketManager.socket('/');
        socket.on('connect', function() {
            console.info('broadcast: Connection established.');
        });
        socket.on('connect_error', function(error) {
            console.error('broadcast: Connection failed:', error);
        });
        socket.on('reconnect', function(attempt) {
            console.info('broadcast: Reconnected on attempt #' + attempt + '.');
        });
        socket.on('reconnect_attempt', function() {
            console.info('broadcast: Retrying connection.');
        });
        socket.on('reconnect_failed', function() {
            console.warn('broadcast: Failed to reconnect.');
        });
        socket.on('connect_timeout', function(timeout) {
            console.info('broadcast: Connection timed out after ' + timeout + 'ms.');
        });
        socket.on('disconnect', function(reason) {
            console.warn('broadcast: Disconnected because:', reason);
        });
        socket.on('broadcast-event', function(message) {
            let callbacks = groupsToCallbacks.get(message.group);
            if (callbacks) {
                callbacks.forEach(function (c) {
                    try {
                        c(message.payload);
                    } catch (ex) {
                        console.error('broadcast: Failed to invoke callback:', c);
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
                let group = params.group;
                //once connected let the server know that we want to use/create this group
                if (socket.connected) {
                    socket.emit('group', group);
                } else {
                    socket.on('connect', function () {
                        socket.emit('group', group);
                    });
                }

                let callbacks = groupsToCallbacks.get(group);
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
}

export function stopListening(params) {
    return new Promise(
        function (resolve, reject) {
            try {
                if (params.group) {
                    if (params.callback) {
                        let callbacks = groupsToCallbacks.get(params.group);
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

export function resumeBroadcastReception() {
    if (socket && socket.disconnected) {
        socket.open();
    } else {
        console.warn('broadcast: Broadcast reception is already on.');
    }
}

export function pauseBroadcastReception() {
    if (socket && socket.connected) {
        socket.close();
    } else {
        console.warn('broadcast: Broadcast reception is already off.');
    }
}
