import * as utils from './private-utils'
import { baseURL } from './voyent'
import io from 'socket.io-client'
import {post} from "./public-utils";
import {updateLastActiveTimestamp} from "./auth-service";
import Map from 'collections/map';


const broadcastURL = baseURL + '/broadcast';
const portMatcher = /\:(\d+)/;
let ioURL;
if (portMatcher.test(baseURL)) {
    ioURL = baseURL.replace(portMatcher, ':3000');
} else if (baseURL[baseURL.length - 1] == '/') {
    ioURL = baseURL.substring(0, baseURL.length - 1) + ':3000';
} else {
    ioURL = baseURL + ':3000';
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


let callbacksToSockets = Map();
let groupsToCallbacks = Map();

export function startListening(params) {
    return new Promise(
        function (resolve, reject) {
            validateRequiredGroup(params, reject);
            validateRequiredCallback(params, reject);

            try {
                let group = params.group;
                const socket = io(ioURL + '/' + group, {
                    transports: ['websocket']//, path: '/io'
                });

                //save group mapping
                let callbacks = groupsToCallbacks.get(group);
                if (!callbacks) {
                    callbacks= [];
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
                    sock.disconnect();
                    callbacksToSockets.delete(params.callback);
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