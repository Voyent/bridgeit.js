import * as utils from './private-utils'
import io from 'socket.io-client'
import { baseURL, post } from "./public-utils";
import { updateLastActiveTimestamp } from "./auth-service";

const broadcastURL = baseURL + '/broadcast';
const portMatcher = /\:(\d+)/;

function ioURL() {
    let url;
    if (portMatcher.test(baseURL)) {
        url = baseURL.replace(portMatcher, ':3000');
    }
    else if (baseURL[baseURL.length - 1] === '/') {
        url = baseURL.substring(0, baseURL.length - 1) + ':3000';
    }
    else {
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

let callbacksToSockets = [];
let groupsToCallbacks = [];
let socketManager;

export function startListening(params) {
    if (!socketManager) {
        socketManager = io.Manager(ioURL(), {
            transports: ['websocket']
        });
        console.log('Created socket manager.');
    }

    return new Promise(
        function (resolve, reject) {
            validateRequiredGroup(params, reject);
            validateRequiredCallback(params, reject);

            try {
                const group = params.group;
                const socket = socketManager.socket('/');
                socket.on('reconnect_attempt', function() {
                    console.log('Websocket connection failed. Falling back to polling.');
                    socket.io.opts.transports = ['polling', 'websocket'];
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
}

export function stopListening(params) {
    return new Promise(
        function (resolve, reject) {
            try {
                if (params.group) {
                    let remainingGroupsToCallbacks = [];
                    for (let i = 0, l = groupsToCallbacks.length; i < l; i++) {
                        let groupToCallback = groupsToCallbacks[i];
                        if (groupToCallback.group === params.group) {
                            let remainingCallbacksToSockets = [];
                            for (let j = 0, lcs = callbacksToSockets.length; j < lcs; j++) {
                                let callbackToSocket = callbacksToSockets[j];
                                if (callbackToSocket.callback === groupToCallback.callback) {
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
                    let remainingCallbacksToSockets = [];
                    for (let j = 0, lcs = callbacksToSockets.length; j < lcs; j++) {
                        let callbackToSocket = callbacksToSockets[j];
                        if (callbackToSocket.callback === params.callback) {
                            callbackToSocket.socket.disconnect();
                        } else {
                            remainingCallbacksToSockets.push(callbackToSocket);
                        }
                        callbacksToSockets = remainingCallbacksToSockets;
                    }

                    let remainingGroupsToCallbacks = [];
                    for (let i = 0, l = groupsToCallbacks.length; i < l; i++) {
                        let groupToCallback = groupsToCallbacks[i];
                        if (groupToCallback.callback !== params.callback) {
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