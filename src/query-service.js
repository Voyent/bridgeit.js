import * as utils from 'private-utils'
import { post, put, doDelete, getJSON, getResourcePermissions as getServiceResourcePermissions, updateResourcePermissions as updateServiceResourcePermissions} from 'public-utils'
import { queryURL } from 'voyent'
import { updateLastActiveTimestamp } from 'auth-service'

function validateRequiredQuery(params, reject){
    utils.validateParameter('query', 'The query parameter is required', params, reject);
}

function validateRequiredTransformer(params, reject){
    utils.validateParameter('transformer', 'The transformer parameter is required', params, reject);
}

/**
 * Create a new query.
 *
 * @memberOf voyent.query
 * @alias createQuery
 * @param {Object} params params
 * @param {String} params.id The query id. If not provided, the service will return a new id
 * @param {Object} params.query The query to be created
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
export function createQuery(params) {
    return new Promise(
        function(resolve, reject) {
            params = params ? params : {};

            //validate
            var account = utils.validateAndReturnRequiredAccount(params, reject);
            var realm = utils.validateAndReturnRequiredRealm(params, reject);
            var token = utils.validateAndReturnRequiredAccessToken(params, reject);
            validateRequiredQuery(params, reject);

            var url = utils.getRealmResourceURL(queryURL, account, realm,
                'queries/' + (params.id ? params.id : ''), token);

            post(url, params.query).then(function(response){
                updateLastActiveTimestamp();
                resolve(response.uri);
            })['catch'](function(error){
                reject(error);
            });

        }
    );
}

/**
 * Update a query.
 *
 * @memberOf voyent.query
 * @alias updateQuery
 * @param {Object} params params
 * @param {String} params.id The query id, the query to be updated
 * @param {Object} params.query The query
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
export function updateQuery(params) {
    return new Promise(
        function(resolve, reject) {
            params = params ? params : {};

            //validate
            var account = utils.validateAndReturnRequiredAccount(params, reject);
            var realm = utils.validateAndReturnRequiredRealm(params, reject);
            var token = utils.validateAndReturnRequiredAccessToken(params, reject);
            validateRequiredQuery(params, reject);
            utils.validateRequiredId(params, reject);

            var url = utils.getRealmResourceURL(queryURL, account, realm,
                'queries/' + params.id, token);

            put(url, params.query).then(function(response){
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function(error){
                reject(error);
            });
        }
    );
}

/**
 * Fetch a query.
 *
 * @memberOf voyent.query
 * @alias getQuery
 * @param {Object} params params
 * @param {String} params.id The query id, the query to fetch
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {Object} The query
 */
export function getQuery(params) {
    return new Promise(
        function(resolve, reject) {
            params = params ? params : {};

            //validate
            var account = utils.validateAndReturnRequiredAccount(params, reject);
            var realm = utils.validateAndReturnRequiredRealm(params, reject);
            var token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            var url = utils.getRealmResourceURL(queryURL, account, realm,
                'queries/' + params.id, token);

            getJSON(url).then(function(query){
                updateLastActiveTimestamp();
                resolve(query);
            })['catch'](function(error){
                reject(error);
            });
        }
    );
}

/**
 * Searches for queries in a realm based on a query.
 *
 * @memberOf voyent.query
 * @alias findQueries
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {Object} params.query A mongo query for the queries
 * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
 * @param {Object} params.options Additional query options such as limit and sort
 * @returns {Object} The results
 */
export function findQueries(params) {
    return new Promise(
        function(resolve, reject) {

            params = params ? params : {};

            //validate
            var account = utils.validateAndReturnRequiredAccount(params, reject);
            var realm = utils.validateAndReturnRequiredRealm(params, reject);
            var token = utils.validateAndReturnRequiredAccessToken(params, reject);

            var url = utils.getRealmResourceURL(queryURL, account, realm,
                'queries/', token, {
                    'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                    'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                    'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                });

            getJSON(url).then(function(doc){
                updateLastActiveTimestamp();
                resolve(doc);
            })['catch'](function(response){
                reject(response);
            });

        }
    );
}

/**
 * Delete a query.
 *
 * @memberOf voyent.query
 * @alias deleteQuery
 * @param {Object} params params
 * @param {String} params.id The query id, the query to be deleted
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 */
export function deleteQuery(params) {
    return new Promise(
        function(resolve, reject) {
            params = params ? params : {};

            //validate
            var account = utils.validateAndReturnRequiredAccount(params, reject);
            var realm = utils.validateAndReturnRequiredRealm(params, reject);
            var token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            var url = utils.getRealmResourceURL(queryURL, account, realm,
                'queries/' + params.id, token);

            doDelete(url).then(function(response){
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function(error){
                reject(error);
            });
        }
    );
}

/**
 * Create a new transformer.
 *
 * @memberOf voyent.query
 * @alias createTransformer
 * @param {Object} params params
 * @param {String} params.id The transformer id. If not provided, the service will return a new id
 * @param {Object} params.transformer The transformer to be created
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
export function createTransformer(params) {
    return new Promise(
        function(resolve, reject) {
            params = params ? params : {};

            //validate
            var account = utils.validateAndReturnRequiredAccount(params, reject);
            var realm = utils.validateAndReturnRequiredRealm(params, reject);
            var token = utils.validateAndReturnRequiredAccessToken(params, reject);
            validateRequiredTransformer(params, reject);

            var url = utils.getRealmResourceURL(queryURL, account, realm,
                'transformers/' + (params.id ? params.id : ''), token);

            post(url, params.transformer).then(function(response){
                updateLastActiveTimestamp();
                resolve(response.uri);
            })['catch'](function(error){
                reject(error);
            });

        }
    );
}

/**
 * Update a transformer.
 *
 * @memberOf voyent.query
 * @alias updateTransformer
 * @param {Object} params params
 * @param {String} params.id The transformer id, the transformer to be updated
 * @param {Object} params.transformer The transformer
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
export function updateTransformer(params) {
    return new Promise(
        function(resolve, reject) {
            params = params ? params : {};

            //validate
            var account = utils.validateAndReturnRequiredAccount(params, reject);
            var realm = utils.validateAndReturnRequiredRealm(params, reject);
            var token = utils.validateAndReturnRequiredAccessToken(params, reject);
            validateRequiredTransformer(params, reject);
            utils.validateRequiredId(params, reject);

            var url = utils.getRealmResourceURL(queryURL, account, realm,
                'transformers/' + params.id, token);

            put(url, params.transformer).then(function(response){
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function(error){
                reject(error);
            });
        }
    );
}

/**
 * Fetch a transformer.
 *
 * @memberOf voyent.query
 * @alias getTransformer
 * @param {Object} params params
 * @param {String} params.id The transformer id, the transformer to fetch
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {Object} The transformer
 */
export function getTransformer(params) {
    return new Promise(
        function(resolve, reject) {
            params = params ? params : {};

            //validate
            var account = utils.validateAndReturnRequiredAccount(params, reject);
            var realm = utils.validateAndReturnRequiredRealm(params, reject);
            var token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            var url = utils.getRealmResourceURL(queryURL, account, realm,
                'transformers/' + params.id, token);

            getJSON(url).then(function(transformer){
                updateLastActiveTimestamp();
                resolve(transformer);
            })['catch'](function(error){
                reject(error);
            });
        }
    );
}

/**
 * Searches for transformers in a realm based on a transformer.
 *
 * @memberOf voyent.query
 * @alias findTransformers
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {Object} params.transformer A mongo transformer for the transformers
 * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
 * @param {Object} params.options Additional transformer options such as limit and sort
 * @returns {Object} The results
 */
export function findTransformers(params) {
    return new Promise(
        function(resolve, reject) {

            params = params ? params : {};

            //validate
            var account = utils.validateAndReturnRequiredAccount(params, reject);
            var realm = utils.validateAndReturnRequiredRealm(params, reject);
            var token = utils.validateAndReturnRequiredAccessToken(params, reject);

            var url = utils.getRealmResourceURL(queryURL, account, realm,
                'transformers/', token, {
                    'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                    'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                    'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                });

            getJSON(url).then(function(transformers){
                updateLastActiveTimestamp();
                resolve(transformers);
            })['catch'](function(response){
                reject(response);
            });

        }
    );
}

/**
 * Delete a transformer.
 *
 * @memberOf voyent.query
 * @alias deleteTransformer
 * @param {Object} params params
 * @param {String} params.id The transformer id, the transformer to be deleted
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 */
export function deleteTransformer(params) {
    return new Promise(
        function(resolve, reject) {
            params = params ? params : {};

            //validate
            var account = utils.validateAndReturnRequiredAccount(params, reject);
            var realm = utils.validateAndReturnRequiredRealm(params, reject);
            var token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            var url = utils.getRealmResourceURL(queryURL, account, realm,
                'transformers/' + params.id, token);

            doDelete(url).then(function(response){
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function(error){
                reject(error);
            });
        }
    );
}

/**
 * Execute a query or query chain.
 *
 * @memberOf voyent.query
 * @alias executeQuery
 * @param {Object} params params
 * @param {String} params.id The query/chain id, the query or query chain to be executed
 * @param {Object} params.execParams Execution parameters that will be passed into parameterized query fields
 * @param {String} params.mode Specify "debug" to return step-by-step query execution data
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {Object} The results
 */
export function executeQuery(params) {
    return new Promise(
        function(resolve, reject) {
            params = params ? params : {};

            //validate
            var account = utils.validateAndReturnRequiredAccount(params, reject);
            var realm = utils.validateAndReturnRequiredRealm(params, reject);
            var token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            var queryParams = {'exec': 'true'};
            queryParams.execParams = (params.execParams ? params.execParams : {});
            if (params.mode) {
                queryParams.mode = params.mode;
            }

            var url = utils.getRealmResourceURL(queryURL, account, realm,
                'queries/' + params.id, token, queryParams);

            getJSON(url).then(function(results){
                updateLastActiveTimestamp();
                resolve(results);
            })['catch'](function(error){
                reject(error);
            });
        }
    );
}

export function getQueryResourcePermissions(params){
    params.path = 'queries';
    return getResourcePermissions(params);
}

export function updateQueryResourcePermissions(params){
    params.path = 'queries';
    return getResourcePermissions(params);
}

export function getTransformerResourcePermissions(params){
    params.path = 'transformers';
    return getResourcePermissions(params);
}

export function updateTransformerResourcePermissions(params){
    params.path = 'transformers';
    return getResourcePermissions(params);
}

export function getResourcePermissions(params){
    params.service = 'query';
    return getServiceResourcePermissions(params);
}

export function updateResourcePermissions(params){
    params.service = 'query';
    return updateServiceResourcePermissions(params);
}
