import * as utils from 'private-utils'
import { post, put, doDelete, getJSON, getResourcePermissions as getServiceResourcePermissions, updateResourcePermissions as updateServiceResourcePermissions} from 'public-utils'
import { docsURL } from 'voyent'
import { updateLastActiveTimestamp } from 'auth-service'

function validateCollection(params, reject) {
    return params.collection ? params.collection : 'documents';
}

/**
 * Create a new document
 *
 * @memberOf voyent.docs
 * @alias createDocument
 * @param {Object} params params
 * @param {String} params.collection The name of the document collection.  Defaults to 'documents'.
 * @param {String} params.id The document id. If not provided, the service will return a new id
 * @param {Object} params.document The document to be created
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
export function createDocument(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const collection = validateCollection(params);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(docsURL, account, realm,
                collection + '/' + (params.id ? params.id : ''), token);

            post(url, params.document).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response.uri);
            })['catch'](function (error) {
                reject(error);
            });

        }
    );
}

/**
 * Update a document
 *
 * @memberOf voyent.docs
 * @alias updateDocument
 * @param {Object} params params
 * @param {String} params.collection The name of the document collection.  Defaults to 'documents'.
 * @param {String} params.id The document id.
 * @param {Object} params.document The document to be created
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
export function updateDocument(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const collection = validateCollection(params);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            const url = utils.getRealmResourceURL(docsURL, account, realm,
                collection + '/' + params.id, token);

            put(url, params.document).then(function () {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Fetch a document
 *
 * @memberOf voyent.docs
 * @alias getDocument
 * @param {Object} params params
 * @param {String} params.collection The name of the document collection.  Defaults to 'documents'.
 * @param {String} params.id The document id. If not provided, the service will return a new id
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {Object} The document
 */
export function getDocument(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const collection = validateCollection(params);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            const url = utils.getRealmResourceURL(docsURL, account, realm,
                collection + '/' + params.id, token);

            getJSON(url).then(function (doc) {
                updateLastActiveTimestamp();
                //the document service always returns a list, so
                //check if we have a list of one, and if so, return the single item
                if (doc.length && doc.length === 1) {
                    resolve(doc[0]);
                }
                else {
                    resolve(doc);
                }
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Searches for documents in a realm based on a query
 *
 * @memberOf voyent.docs
 * @alias findDocuments
 * @param {Object} params params
 * @param {String} params.collection The name of the document collection.  Defaults to 'documents'.
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {Object} params.query A mongo query for the documents
 * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
 * @param {Object} params.options Additional query options such as limit and sort
 * @returns {Object} The results
 */
export function findDocuments(params) {
    return new Promise(
        function (resolve, reject) {

            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const collection = validateCollection(params);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(docsURL, account, realm,
                collection, token, {
                    'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                    'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                    'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                });

            getJSON(url).then(function (doc) {
                updateLastActiveTimestamp();
                resolve(doc);
            })['catch'](function (response) {
                //service currently returns a 404 when no documents are found
                if (response.status == 404) {
                    resolve(null);
                }
                else {
                    reject(response);
                }
            });

        }
    );
}

/**
 * Get all document collections
 *
 * @memberOf voyent.docs
 * @alias deleteDocument
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

export function getCollections(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(docsURL, account, realm,
                "collections", token, {});

            getJSON(url).then(function (collections) {
                updateLastActiveTimestamp();
                resolve(collections);
            })['catch'](function (response) {
                //service currently returns a 404 when no collections are found
                if (response.status == 404) {
                    resolve(null);
                }
                else {
                    reject(response);
                }
            });
        }
    );
}

/**
 * Delete a new document
 *
 * @memberOf voyent.docs
 * @alias deleteDocument
 * @param {Object} params params
 * @param {String} params.collection The name of the document collection.  Defaults to 'documents'.
 * @param {String} params.id The document id. If not provided, the service will return a new id
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 */
export function deleteDocument(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const collection = validateCollection(params);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            const url = utils.getRealmResourceURL(docsURL, account, realm,
                collection + '/' + params.id, token);

            doDelete(url).then(function (response) {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

export function getResourcePermissions(params) {
    params.service = 'docs';
    params.path = 'documents';
    return getServiceResourcePermissions(params);
}

export function updateResourcePermissions(params) {
    params.service = 'docs';
    params.path = 'documents';
    return updateServiceResourcePermissions(params);
}