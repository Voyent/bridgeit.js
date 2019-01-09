import * as utils from './private-utils'
//import { broadcastURL } from './voyent'
import io from 'socket.io-client'
import {post} from "./public-utils";
import {updateLastActiveTimestamp} from "./auth-service";
import Map from 'collections/map';


var broadcastURL = 'http://0.0.0.0:33005/broadcast'

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
                const socket = io('http://0.0.0.0:3000/' + group, {
                    transports: ['websocket']
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

            let url = broadcastURL;
            post(url, params).then(function (response) {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}