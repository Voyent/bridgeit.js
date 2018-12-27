import * as utils from 'private-utils'
import { post, doDelete, getJSON, getResourcePermissions as getServiceResourcePermissions, updateResourcePermissions as updateServiceResourcePermissions} from 'public-utils'
import { storageURL } from 'voyent'
import { updateLastActiveTimestamp } from 'auth-service'

function validateRequiredBlob(params, reject){
        utils.validateParameter('blob', 'The blob parameter is required', params, reject);
    }

    function validateRequiredFile(params, reject){
        utils.validateParameter('file', 'The file parameter is required', params, reject);
    }

/**
 * Retrieve the storage meta info for the realm
 *
 * @memberOf voyent.storage
 * @alias getMetaInfo
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {String} params.scope (default 'self') 'all' or 'self', return meta information for blobs belonging
 *     to all users, or only those belonging to the current user
 * @returns {Object} The results
 */
export function getMetaInfo(params){
    return new Promise(function(resolve, reject) {
        params = params ? params : {};

        //validate
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealm(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const url = utils.getRealmResourceURL(storageURL, account, realm,
            'meta', token, params.scope ? {scope: params.scope} : null);


        getJSON(url).then(function(response){
            updateLastActiveTimestamp();
            resolve(response.directory);
        })['catch'](function(error){
            reject(error);
        });
    });
}

/**
 * Stores a blob
 *
 * @memberOf voyent.storage
 * @alias uploadBlob
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.id The blob id. If not provided, the service will return a new id
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {Object} params.blob The Blob to store
 * @param {Function} params.progressCallback The callback function to call on progress events. eg. function
 *     progressCallback(percentComplete, xhr){..}
 * @returns {Object} The results
 */
export function uploadBlob(params){
    return new Promise(function(resolve, reject) {
        params = params ? params : {};

        //validate
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealm(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        validateRequiredBlob(params, reject);

        const formData = new FormData();
        formData.append('file', params.blob);

        const url = utils.getRealmResourceURL(storageURL, account, realm,
            'blobs' + (params.id ? '/' + params.id : ''), token);

        post(url, formData, null, true, null, params.progressCallback).then(function(response){
            updateLastActiveTimestamp();
            resolve(response.location || response.uri);
        })['catch'](function(error){
            reject(error);
        });
    });
}

/**
 * Stores a file
 *
 * @memberOf voyent.storage
 * @alias uploadBlob
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.id The blob id. If not provided, the service will return a new id
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {Object} params.file The Blob to store
 * @param {Function} params.progressCallback The callback function to call on progress events. eg. function
 *     progressCallback(percentComplete, xhr){..}
 * @param {Function} params.onabort The callback for the XMLHttpRequest onabort event
 * @param {Function} params.onerror The callback for the XMLHttpRequest onerror event
 * @returns {Object} The results
 */
export function uploadFile(params){
    return new Promise(function(resolve, reject) {
        params = params ? params : {};

        //validate
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealm(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        validateRequiredFile(params, reject);

        const url = utils.getRealmResourceURL(storageURL, account, realm,
            'blobs' + (params.id ? '/' + params.id : ''), token);
        const formData = new FormData();
        formData.append('file', params.file);

        post(url, formData, null, true, null, params.progressCallback, params.onabort, params.onerror).then(function(response){
            updateLastActiveTimestamp();
            resolve(response.location || response.uri);
        })['catch'](function(error){
            reject(error);
        });
    });
}

/**
 * Retrieves a blob file from the storage service
 *
 * @memberOf voyent.storage
 * @alias getBlob
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.id The blob id.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {Object} The blob arraybuffer
 */
export function getBlob(params){
    return new Promise(function(resolve, reject) {
        params = params ? params : {};

        //validate
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealm(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        utils.validateRequiredId(params, reject);

        const url = utils.getRealmResourceURL(storageURL, account, realm,
            'blobs/' + params.id, token);

        getBlob(url).then(function(response){
            updateLastActiveTimestamp();
            resolve(response);
        })['catch'](function(error){
            reject(error);
        });
    });
}

/**
 * Deletes a blob file from the storage service
 *
 * @memberOf voyent.storage
 * @alias deleteBlob
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.id The blob id.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 */
export function deleteBlob(params){
    return new Promise(function(resolve, reject) {
        params = params ? params : {};

        //validate
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealm(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        utils.validateRequiredId(params, reject);

        const url = utils.getRealmResourceURL(storageURL, account, realm,
            'blobs/' + params.id, token);

        doDelete(url).then(function(response){
            updateLastActiveTimestamp();
            resolve();
        })['catch'](function(error){
            reject(error);
        });
    });
}

export function getBlobResourcePermissions(params){
    params.path = 'blobs';
    return getResourcePermissions(params);
}

export function updateBlobResourcePermissions(params){
    params.path = 'blobs';
    return getResourcePermissions(params);
}

export function getResourcePermissions(params){
    params.service = 'storage';
    return getServiceResourcePermissions(params);
}

export function updateResourcePermissions(params){
    params.service = 'storage';
    return updateServiceResourcePermissions(params);
}
