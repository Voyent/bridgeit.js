import * as utils from './private-utils'
import { actionURL, post, put, doDelete, getJSON, getResourcePermissions as getServiceResourcePermissions, updateResourcePermissions as updateServiceResourcePermissions} from './public-utils'
import { updateLastActiveTimestamp } from './auth-service'

function validateRequiredAction(params, reject) {
    utils.validateParameter('action', 'The action parameter is required', params, reject);
}

/**
 * Execute an action
 *
 * @memberOf voyent.action
 * @alias executeAction
 * @param {Object} params params
 * @param {String} params.id The action id, the action to be executed
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.io.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {String} The resource URI
 */
export function executeAction(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            const url = utils.getRealmResourceURL(actionURL, account, realm,
                'actions/' + params.id, token, {'op': 'exec'});

            post(url).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response);
            })['catch'](function (error) {
                reject(error);
            });

        }
    );
}

/**
 * Create a new action
 *
 * @memberOf voyent.action
 * @alias createAction
 * @param {Object} params params
 * @param {String} params.id The action id
 * @param {Object} params.action The action to be created
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.io.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {String} The resource URI
 */
export function createAction(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);
            validateRequiredAction(params, reject);

            const url = utils.getRealmResourceURL(actionURL, account, realm,
                'actions/' + params.id, token);

            post(url, params.action).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response.uri);
            })['catch'](function (error) {
                reject(error);
            });

        }
    );
}

/**
 * Update an action
 *
 * @memberOf voyent.action
 * @alias updateAction
 * @param {Object} params params
 * @param {String} params.id The action id, the action to be updated
 * @param {Object} params.action The new action
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.io.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 */
export function updateAction(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);
            validateRequiredAction(params, reject);

            const url = utils.getRealmResourceURL(actionURL, account, realm,
                'actions/' + params.id, token);

            put(url, params.action).then(function () {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Fetch an action
 *
 * @memberOf voyent.action
 * @alias getAction
 * @param {Object} params params
 * @param {String} params.id The action id, the action to fetch
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.io.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {Object} The action
 */
export function getAction(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            const url = utils.getRealmResourceURL(actionURL, account, realm,
                'actions/' + params.id, token);

            getJSON(url).then(function (action) {
                updateLastActiveTimestamp();
                resolve(action);
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Searches for actions in a realm based on a query
 *
 * @memberOf voyent.action
 * @alias findActions
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.io.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @param {Object} params.query A mongo query for the actions
 * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
 * @param {Object} params.options Additional query options such as limit and sort
 * @returns {Object} The results
 */
export function findActions(params) {
    return new Promise(
        function (resolve, reject) {

            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(actionURL, account, realm,
                'actions/', token, {
                    'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                    'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                    'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                });

            getJSON(url).then(function (actions) {
                updateLastActiveTimestamp();
                resolve(actions);
            })['catch'](function (response) {
                reject(response);
            });

        }
    );
}

/**
 * Delete an action
 *
 * @memberOf voyent.action
 * @alias deleteAction
 * @param {Object} params params
 * @param {String} params.id The action id, the action to be deleted
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.io.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 */
export function deleteAction(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            const url = utils.getRealmResourceURL(actionURL, account, realm,
                'actions/' + params.id, token);

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
 * Fetch available task groups
 *
 * @memberOf voyent.action
 * @alias getTaskGroups
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.io.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {Object} The task group schemas
 */
export function getTaskGroups(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(actionURL, account, realm,
                'taskGroups/', token);

            getJSON(url).then(function (tasksGroups) {
                updateLastActiveTimestamp();
                resolve(tasksGroups);
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Fetch available tasks
 *
 * @memberOf voyent.action
 * @alias getTasks
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.io.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {Object} The task schemas
 */
export function getTasks(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(actionURL, account, realm,
                'tasks/', token);

            getJSON(url).then(function (tasks) {
                updateLastActiveTimestamp();
                resolve(tasks);
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Execute a module.
 *
 * @memberOf voyent.action
 * @alias executeModule
 * @param {Object} params params
 * @param {String} params.id The module id, the module to be executed
 * @param {String} params.params Additional parameters to include in the module request
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.io.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {String} The resource URI
 */
export function executeModule(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            let moduleParams = {};
            if (params.params && typeof params.params === 'object' && Object.keys(params.params).length) {
                moduleParams = params.params;
            }

            const url = utils.getRealmResourceURL(actionURL, account, realm,
                'modules/' + params.id, token);

            post(url, moduleParams).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response);
            })['catch'](function (error) {
                reject(error);
            });

        }
    );
}

/**
 * Executes a module with form data.
 *
 * @memberOf voyent.action
 * @alias uploadFilesToModule
 * @param {Object} params params
 * @param {String} params.id The module id, the module to be executed. Required.
 * @param {Array} params.files The files to be uploaded. Required.
 * @param {Function} params.progressCb The optional function to call on progress events. eg. cb(percentComplete, xhr){...}
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *     voyent.io.auth.connect() will be used
 * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
 *     default will be used. (optional)
 * @returns {*} The response
 */
export function uploadFilesToModule(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);
            utils.validateParameter('files', 'The files parameter is required', params, reject);

            let formData = new FormData();
            if (params.files.length) {
                for (var i=0; i<params.files.length; i++) {
                    formData.append('file'+(i+1), params.files[i]);
                }
            }
            else {
                return reject((Error('The files parameter is empty')));
            }

            const url = utils.getRealmResourceURL(actionURL, account, realm,
                'modules/' + params.id, token);

            post(url, formData, null, true, null, params.progressCb).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response);
            })['catch'](function (error) {
                reject(error);
            });

        }
    );
}

/**
 * Get preview metrics.
 * @memberOf voyent.action
 * @alias getPreviewMetrics
 * @param {Object} params params
 * @param {String} params.id The preview metrics id, the preview metrics to get (required).
 * @param {String} params.account Voyent Services account name (optional).
 * @param {String} params.realm The Voyent Services realm (optional).
 * @param {String} params.accessToken The Voyent authentication token (optional).
 * @param {String} params.host The Voyent Services host url (optional).
 * @returns {Object} The preview metrics.
 */
export function getPreviewMetrics(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            const url = utils.getRealmResourceURL(actionURL, account, realm,
                'previewMetrics/' + params.id, token);

            getJSON(url).then(function (previewMetrics) {
                updateLastActiveTimestamp();
                resolve(previewMetrics);
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Get notification history.
 * @memberOf voyent.action
 * @alias getNotificationHistory
 * @param {Object} params params
 * @param {String} params.id The notification history document id, the notification history document to get (required).
 * @param {String} params.account Voyent Services account name (optional).
 * @param {String} params.realm The Voyent Services realm (optional).
 * @param {String} params.accessToken The Voyent authentication token (optional).
 * @param {String} params.host The Voyent Services host url (optional).
 * @returns {Object} The notification history.
 */
export function getNotificationHistory(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);

            const url = utils.getRealmResourceURL(actionURL, account, realm,
                'notificationHistory/' + params.id, token);

            getJSON(url).then(function (notificationHistory) {
                updateLastActiveTimestamp();
                resolve(notificationHistory);
            }).catch(function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Generate an auto login URL for the passed `username` and `originalURL`.
 * @memberOf voyent.action
 * @alias generateAutoLoginURL
 * @param {Object} params params
 * @param {String} params.username The user to generate the URL for.
 * @param {String} params.originalURL The original URL to add the login parameters to.
 * @param {String} [params.account] Voyent Services account name.
 * @param {String} [params.realm] The Voyent Services realm.
 * @param {String} [params.accessToken] The Voyent authentication token.
 * @param {String} [params.host] The Voyent Services host url.
 * @returns {Object} The auto login URL.
 */
export function generateAutoLoginURL(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            const username = utils.validateAndReturnRequiredUsername(params, reject);
            const originalURL = utils.isValidString(params.originalURL) ? params.originalURL : '';
            if (!originalURL) {
                return reject(new Error('the originalURL is required'));
            }

            const url = utils.getRealmResourceURL(actionURL, account, realm,
                'autoLoginURL/' + username, token);

            post(url, { originalURL: params.originalURL }).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response);
            }).catch(function(error) {
                reject(error);
            });
        }
    );
}

export function getResourcePermissions(params) {
    params.service = 'action';
    params.path = 'actions';
    return getServiceResourcePermissions(params);
}

export function updateResourcePermissions(params) {
    params.service = 'action';
    params.path = 'actions';
    return updateServiceResourcePermissions(params);
}

