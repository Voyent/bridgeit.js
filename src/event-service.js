import * as utils from './private-utils'
import { post, getJSON } from './public-utils'
import { eventURL } from './voyent'
import { updateLastActiveTimestamp, getLastKnownAccount, getLastKnownRealm, getLastAccessToken } from './auth-service'

function validateRequiredEvent(params, reject){
    utils.validateParameter('event', 'The event parameter is required', params, reject);
}

let eventArray = [];
let eventsRunning;
let runningIndex = 0;
let eventIndex = 0;

/**
 * Searches for events in a realm based on a query
 *
 * @memberOf voyent.event
 * @alias findEvents
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {Object} params.query A mongo query for the events
 * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
 * @param {Object} params.options Additional query options such as limit and sort
 * @returns {Object} The results
 */
export function findEvents(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(eventURL, account, realm,
                'events', token, {
                    'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                    'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                    'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                });

            getJSON(url).then(function (events) {
                updateLastActiveTimestamp();
                resolve(events);
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Store a custom event in the event service.
 *
 * @memberOf voyent.event
 * @alias createCustomEvent
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {Object} params.event The custom event that you would like to store, in JSON format.
 * @returns {Promise<String>} The resource URI
 */
export function createCustomEvent(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            validateRequiredEvent(params, reject);

            const url = utils.getRealmResourceURL(eventURL, account, realm,
                'events', token);

            post(url, params.event).then(function (response) {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Store an array of custom events in the event service.
 *
 * @memberOf voyent.event
 * @alias createCustomEvents.
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account will
 *     be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name will
 *     be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {Object} params.eventArray An array of events that you want to fire. Events should include a 'delay'
 *     property, with the number of milliseconds to wait since the last event before firing.
 */

export function createCustomEvents(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            const url = utils.getRealmResourceURL(eventURL, account, realm,
                'events', token);

            eventArray = params.eventArray;
            eventsRunning = true;
            runningIndex += 1;
            eventIndex = 0;
            _eventRecursion(resolve, reject, url, runningIndex);
        }
    );
}
/**
 * Convenience method to reduce code-reuse.
 */
export function _eventRecursion(resolve, reject, url, index) {
    //if no url is provided then generate the URL using the latest account/realm/token
    if (!url) {
        url = utils.getRealmResourceURL(eventURL, getLastKnownAccount(), getLastKnownRealm(),
            'events', getLastAccessToken());
    }
    if (index === runningIndex) {
        setTimeout(function () {
            if (index === runningIndex) {
                const date = new Date();
                post(url, eventArray[eventIndex]).then(function (response) {
                    updateLastActiveTimestamp();
                    if (eventIndex === eventArray.length - 1) {
                        resolve();
                    }
                    else {
                        eventIndex += 1;
                        _eventRecursion(resolve, reject, null, index);
                    }
                })['catch'](function (error) {
                    reject(error);
                });
            }
       }, eventArray[eventIndex].delay)
    }
}

/**
 * Convenience method for stopping multiple events midway through
 *
 * @memberOf voyent.event
 * @alias stopEvents.
 */
export function stopEvents() {
    eventsRunning = false;
    runningIndex += 1;
}

/**
 * Restart a previously paused event array
 *
 * @memberOf voyent.event
 * @alias restartEvents.
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account will
 *     be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name will
 *     be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 */
export function restartEvents(params) {
    eventsRunning = true;
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            const url = utils.getRealmResourceURL(eventURL, account, realm,
                'events', token);
            _eventRecursion(resolve, reject, url, runningIndex);
        }
    );
}

/**
 * Convenience method for getting the total number of events being process
 *
 * @memberOf voyent.event
 * @alias getEventsSize.
 */
export function getEventsSize() {
    return eventArray.length;
}

/**
 * Convenience method for getting the currently running event
 *
 * @memberOf voyent.event
 * @alias getCurrentEvent.
 */
export function getCurrentEvent() {
    return eventIndex + 1;
}
/**
 * Retrieve the time difference in milliseconds between the provided time and the event server time.
 *
 * Useful for displaying accurate live event views. The time difference is returned as client time - server
 * time.
 *
 * @memberOf voyent.event
 * @alias getClientServerTimeGap
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {Promise<Number>} The time difference in milliseconds
 */
export function getClientServerTimeGap(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(eventURL, account, realm,
                'time', token, {
                    clientTime: encodeURIComponent(new Date().toISOString())
                });

            getJSON(url).then(function (response) {
                if (response.timeOffset) {
                    updateLastActiveTimestamp();
                    resolve(response.timeOffset);
                }
                else {
                    reject(new Error('getClientServerTimeGap() could not parse response: ' +
                        JSON.stringify(response)));
                }
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}
