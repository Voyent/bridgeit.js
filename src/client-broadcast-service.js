import * as utils from './private-utils'
import io from 'socket.io-client'
import { baseURL, post } from "./public-utils";
import { updateLastActiveTimestamp } from "./auth-service";

const broadcastURL = baseURL + '/broadcast';
const portMatcher = /\:(\d+)/;

function ioURL() {
    var url;
    if (portMatcher.test(baseURL)) {
        url = baseURL.replace(portMatcher, ':3000');
    } else if (baseURL[baseURL.length - 1] == '/') {
        url = baseURL.substring(0, baseURL.length - 1) + ':3000';
    } else {
        url = baseURL + ':3000';
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
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 3,
            rememberUpgrade: true
        });
        socket = socketManager.socket('/');
        console.log('Created socket.');
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
        socket.on('broadcast-event', function(message) {
            let callbacks = groupsToCallbacks.get(message.group);
            if (callbacks) {
                callbacks.forEach(function (c) {
                    try {
                        c(message.payload);
                    } catch (ex) {
                        console.error('Failed to invoke callback ' + c);
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
                socket.on('connect', function() {
                    socket.emit('group', group);
                });

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