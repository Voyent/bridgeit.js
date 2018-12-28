import * as utils from './private-utils'
import { post, put, doDelete, getJSON, getResourcePermissions as getServiceResourcePermissions, updateResourcePermissions as updateServiceResourcePermissions} from './public-utils'
import { eventhubURL } from './voyent'
import { updateLastActiveTimestamp } from './auth-service'

function validateRequiredHandler(params, reject) {
    utils.validateParameter('handler', 'The handler parameter is required', params, reject);
}

function validateRequiredRecognizer(params, reject) {
    utils.validateParameter('handler', 'The recognizer parameter is required', params, reject);
}
 
/**
 * Create a new event handler
 *
 * @memberOf voyent.eventhub
 * @alias createHandler
 * @param {Object} params params
 * @param {String} params.id The handler id
 * @param {Object} params.handler The event handler to be created
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {String} The resource URI
 */
export function createHandler(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            validateRequiredHandler(params, reject);

            const url = utils.getRealmResourceURL(eventhubURL, account, realm,
                'handlers/' + (params.id ? params.id : ''), token);

            post(url, params.handler).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response.uri);
            })['catch'](function (error) {
                reject(error);
            });

        }
    );
}

/**
 * Update an event handler
 *
 * @memberOf voyent.eventhub
 * @alias updateHandler
 * @param {Object} params params
 * @param {String} params.id The handler id, the event handler to be updated
 * @param {Object} params.handler The new event handler
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 */
export function updateHandler(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);
            validateRequiredHandler(params, reject);

            const url = utils.getRealmResourceURL(eventhubURL, account, realm,
                'handlers/' + params.id, token);

            put(url, params.handler).then(function () {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Fetch an event handler
 *
 * @memberOf voyent.eventhub
 * @alias getHandler
 * @param {Object} params params
 * @param {String} params.id The handler id, the event handler to fetch
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {Object} The event handler
 */
export function getHandler(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            const url = utils.getRealmResourceURL(eventhubURL, account, realm,
                'handlers/' + params.id, token);

            getJSON(url).then(function (handler) {
                updateLastActiveTimestamp();
                resolve(handler);
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Searches for event handlers in a realm based on a query
 *
 * @memberOf voyent.eventhub
 * @alias findHandlers
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {Object} params.query A mongo query for the event handlers
 * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
 * @param {Object} params.options Additional query options such as limit and sort
 * @returns {Object} The results
 */
export function findHandlers(params) {
    return new Promise(
        function (resolve, reject) {

            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(eventhubURL, account, realm,
                'handlers/', token, {
                    'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                    'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                    'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                });

            getJSON(url).then(function (handlers) {
                updateLastActiveTimestamp();
                resolve(handlers);
            })['catch'](function (response) {
                reject(response);
            });

        }
    );
}

/**
 * Delete an event handler
 *
 * @memberOf voyent.eventhub
 * @alias deleteHandler
 * @param {Object} params params
 * @param {String} params.id The handler id, the event handler to be deleted
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 */
export function deleteHandler(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            const url = utils.getRealmResourceURL(eventhubURL, account, realm,
                'handlers/' + params.id, token);

            doDelete(url).then(function () {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Delete event handlers in a realm based on a query
 *
 * @memberOf voyent.eventhub
 * @alias deleteHandlers
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {Object} params.query A mongo query for the event handlers
 * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
 * @param {Object} params.options Additional query options such as limit and sort
 */
export function deleteHandlers(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(eventhubURL, account, realm,
                'handlers/', token, {
                    'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                    'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                    'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                });

            doDelete(url).then(function () {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Create a new event recognizer
 *
 * @memberOf voyent.eventhub
 * @alias createRecognizer
 * @param {Object} params params
 * @param {String} params.id The recognizer id
 * @param {Object} params.recognizer The event recognizer to be created
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {String} The resource URI
 */
export function createRecognizer(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            validateRequiredRecognizer(params, reject);

            const url = utils.getRealmResourceURL(eventhubURL, account, realm,
                'recognizers/' + (params.id ? params.id : ''), token);

            post(url, params.recognizer).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response.uri);
            })['catch'](function (error) {
                reject(error);
            });

        }
    );
}

/**
 * Update an event recognizer
 *
 * @memberOf voyent.eventhub
 * @alias updateRecognizer
 * @param {Object} params params
 * @param {String} params.id The recognizer id, the event recognizer to be updated
 * @param {Object} params.recognizer The new event recognizer
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 */
export function updateRecognizer(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);
            validateRequiredRecognizer(params, reject);

            const url = utils.getRealmResourceURL(eventhubURL, account, realm,
                'recognizers/' + params.id, token);

            put(url, params.recognizer).then(function () {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Fetch an event recognizer
 *
 * @memberOf voyent.eventhub
 * @alias getRecognizer
 * @param {Object} params params
 * @param {String} params.id The recognizer id, the event recognizer to fetch
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {Object} The event recognizer
 */
export function getRecognizer(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            const url = utils.getRealmResourceURL(eventhubURL, account, realm,
                'recognizers/' + params.id, token);

            getJSON(url).then(function (recognizer) {
                updateLastActiveTimestamp();
                resolve(recognizer);
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Searches for event recognizers in a realm based on a query
 *
 * @memberOf voyent.eventhub
 * @alias findRecognizers
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {Object} params.query A mongo query for the event recognizers
 * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
 * @param {Object} params.options Additional query options such as limit and sort
 * @returns {Object} The results
 */
export function findRecognizers(params) {
    return new Promise(
        function (resolve, reject) {

            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(eventhubURL, account, realm,
                'recognizers/', token, {
                    'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                    'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                    'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                });

            getJSON(url).then(function (recognizers) {
                updateLastActiveTimestamp();
                resolve(recognizers);
            })['catch'](function (response) {
                reject(response);
            });

        }
    );
}

/**
 * Delete an event recognizer
 *
 * @memberOf voyent.eventhub
 * @alias deleteRecognizer
 * @param {Object} params params
 * @param {String} params.id The recognizer id, the event recognizer to be deleted
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 */
export function deleteRecognizer(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            const url = utils.getRealmResourceURL(eventhubURL, account, realm,
                'recognizers/' + params.id, token);

            doDelete(url).then(function () {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Delete event recognizers in a realm based on a query
 *
 * @memberOf voyent.eventhub
 * @alias deleteRecognizers
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {Object} params.query A mongo query for the event recognizers
 * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
 * @param {Object} params.options Additional query options such as limit and sort
 */
export function deleteRecognizers(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(eventhubURL, account, realm,
                'recognizers/', token, {
                    'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                    'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                    'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                });

            doDelete(url).then(function () {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

export function getRecognizerResourcePermissions(params) {
    params.path = 'recognizers';
    return getResourcePermissions(params);
}

export function updateRecognizerResourcePermissions(params) {
    params.path = 'recognizers';
    return getResourcePermissions(params);
}

export function getHandlerResourcePermissions(params) {
    params.path = 'handlers';
    return getResourcePermissions(params);
}

export function updateHandlerResourcePermissions(params) {
    params.path = 'handlers';
    return updateResourcePermissions(params);
}

export function getResourcePermissions(params) {
    params.service = 'eventhub';
    return getServiceResourcePermissions(params);
}

export function updateResourcePermissions(params) {
    params.service = 'eventhub';
    return updateServiceResourcePermissions(params);
}