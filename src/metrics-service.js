import * as utils from './private-utils'
import { post, getJSON } from './public-utils'
import { metricsURL } from './voyent'
import { updateLastActiveTimestamp } from './auth-service'

function validateRequiredEvent(params, reject){
    utils.validateParameter('event', 'The event parameter is required', params, reject);
}

/**
 * Searches for events in a realm based on a query
 *
 * @memberOf voyent.metrics
 * @alias findEvents
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.io.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {Object} params.query A mongo query for the events
 * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
 * @param {Object} params.options Additional query options such as limit and sort
 * @returns {Object} The results
 */
export function findEvents(params) {
    return new Promise(
        function(resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(metricsURL, account, realm,
                'events', token, {
                    'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                    'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                    'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                });

            getJSON(url).then(function(events){
                updateLastActiveTimestamp();
                resolve(events);
            })['catch'](function(error){
                reject(error);
            });
        }
    );
}

/**
 * Store a custom event in the event service.
 *
 * @memberOf voyent.metrics
 * @alias createCustomEvent
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.io.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {Object} params.event The custom event that you would like to store, in JSON format.
 * @returns {String} The resource URI
 */
export function createCustomEvent(params) {
    return new Promise(
        function(resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            validateRequiredEvent(params, reject);

            const url = utils.getRealmResourceURL(metricsURL, account, realm,
                'events', token);

            post(url, params.event).then(function(response){
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function(error){
                reject(error);
            });
        }
    );
}

/**
 * Retrieve the time difference in milliseconds between the provided time and the event server time.
 *
 * Useful for displaying accurate live metrics views. The time difference is returned as client time - server
 * time.
 *
 * @memberOf voyent.metrics
 * @alias getClientServerTimeGap
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.io.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {Number} The time difference in milliseconds
 */
export function getClientServerTimeGap(params) {
    return new Promise(
        function(resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(metricsURL, account, realm,
                'time', token, {
                    clientTime: encodeURIComponent(new Date().toISOString())
                });

            getJSON(url).then(function(response){
                if( response.timeOffset){
                    updateLastActiveTimestamp();
                    resolve(response.timeOffset);
                }
                else{
                    reject(new Error('getClientServerTimeGap() could not parse response: ' +
                        JSON.stringify(response)));
                }
            })['catch'](function(error){
                reject(error);
            });
        }
    );
}
