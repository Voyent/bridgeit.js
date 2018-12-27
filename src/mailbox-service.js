import * as utils from 'private-utils'
import { post, put, doDelete, getJSON, getResourcePermissions as getServiceResourcePermissions, updateResourcePermissions as updateServiceResourcePermissions} from 'public-utils'
import { mailboxURL } from 'voyent'
import { updateLastActiveTimestamp } from 'auth-service'

function validateRequiredMessages(params, reject) {
    utils.validateParameter('mailbox', 'The messages parameter is required', params, reject);
}

function validateRequiredConfig(params, reject) {
    utils.validateParameter('config', 'The config parameter is required', params, reject);
}

/**
 * Create one or more messages for one or more users.
 *
 * @memberOf voyent.mailbox
 * @alias createMultiUserMessages
 * @param {Object} params params
 * @param {Array} params.messages The message(s) to be created.
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 * will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 * will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 * voyent.auth.connect() will be used.
 * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
 * default will be used.
 * @returns {String} The resource URI(s).
 */
export function createMultiUserMessages(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            validateRequiredMessages(params, reject);

            const url = utils.getRealmResourceURL(mailboxURL, account, realm,
                'mailboxes', token);

            post(url, params.messages).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response.uris);
            })['catch'](function (error) {
                reject(error);
            });

        }
    );
}

/**
 * Create one or more messages for a specific user.
 *
 * @memberOf voyent.mailbox
 * @alias createMessages
 * @param {Object} params params
 * @param {Array} params.messages The message(s) to be created.
 * @param {String} params.username The user to create the message(s) for.
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 * will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 * will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 * voyent.auth.connect() will be used.
 * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
 * default will be used.
 * @returns {String} The resource URI(s).
 */
export function createMessages(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            validateRequiredMessages(params, reject);
            utils.validateRequiredUsername(params, reject);

            const url = utils.getRealmResourceURL(mailboxURL, account, realm,
                'mailboxes/' + params.username + '/messages', token);

            post(url, params.messages).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response.uris);
            })['catch'](function (error) {
                reject(error);
            });

        }
    );
}

/**
 * Retrieve a single specific message for a specific user.
 *
 * @memberOf voyent.mailbox
 * @alias getMessage
 * @param {Object} params params
 * @param {String} params.id The message id, the message to fetch.
 * @param {String} params.username The user to create the message(s) for.
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 * will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 * will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 * voyent.auth.connect() will be used.
 * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
 * default will be used.
 * @returns {Object} The message.
 */
export function getMessage(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);
            utils.validateRequiredUsername(params, reject);

            const url = utils.getRealmResourceURL(mailboxURL, account, realm,
                'mailboxes/' + params.username + '/messages/' + params.id, token);

            getJSON(url).then(function (message) {
                updateLastActiveTimestamp();
                resolve(message);
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Retrieve messages for a specific user based on the results returned from query parameters. Optionally include
 * a type property to further refine the search.
 *
 * @memberOf voyent.mailbox
 * @alias findMessages
 * @param {Object} params params
 * @param {String} params.username The user to find message(s) for.
 * @param {String} params.type The type of messages to get. Valid options are "read" or "unread". Not required.
 * @param {Object} params.query A mongo query for the messages.
 * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set.
 * @param {Object} params.options Additional query options such as limit and sort.
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 * will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 * will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 * voyent.auth.connect() will be used.
 * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
 * default will be used.
 * @returns {Object} The results.
 */
export function findMessages(params) {
    return new Promise(
        function (resolve, reject) {

            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredUsername(params, reject);

            const url = utils.getRealmResourceURL(mailboxURL, account, realm,
                'mailboxes/' + params.username + '/messages' + (params.type ? ('/type/' + params.type) : ''),
                token, {
                    'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                    'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                    'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                });

            getJSON(url).then(function (messages) {
                updateLastActiveTimestamp();
                resolve(messages);
            })['catch'](function (response) {
                reject(response);
            });

        }
    );
}

/**
 * Remove a single specific message for a specific user.
 *
 * @memberOf voyent.mailbox
 * @alias deleteMessage
 * @param {Object} params params
 * @param {String} params.id The message id, the message to delete.
 * @param {String} params.username The user to create the message(s) for.
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 * will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 * will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 * voyent.auth.connect() will be used.
 * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
 * default will be used.
 */
export function deleteMessage(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredId(params, reject);
            utils.validateRequiredUsername(params, reject);

            const url = utils.getRealmResourceURL(mailboxURL, account, realm,
                'mailboxes/' + params.username + '/messages/' + params.id, token);

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
 * Remove messages for a specific user based on the results returned from query parameters. Optionally include a
 * type property to further refine the search.
 *
 * @memberOf voyent.mailbox
 * @alias deleteMessages
 * @param {Object} params params
 * @param {String} params.username The user to find message(s) for.
 * @param {String} params.type The type of messages to get. Valid options are "read" or "unread". Not required.
 * @param {Object} params.query A mongo query for the messages.
 * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set.
 * @param {Object} params.options Additional query options such as limit and sort.
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 * will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 * will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 * voyent.auth.connect() will be used.
 * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
 * default will be used.
 * @returns {Object} The results
 */
export function deleteMessages(params) {
    return new Promise(
        function (resolve, reject) {

            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            utils.validateRequiredUsername(params, reject);

            const url = utils.getRealmResourceURL(mailboxURL, account, realm,
                'mailboxes/' + params.username + '/messages' + (params.type ? ('/type/' + params.type) : ''),
                token, {
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
 * Retrieve the configuration options for this service.
 *
 * @memberOf voyent.mailbox
 * @alias getConfig
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 * will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 * will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 * voyent.auth.connect() will be used.
 * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
 * default will be used.
 * @returns {Object} The config
 */
export function getConfig(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            const url = utils.getRealmResourceURL(mailboxURL, account, realm,
                'config', token);

            getJSON(url).then(function (config) {
                updateLastActiveTimestamp();
                resolve(config);
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

/**
 * Update the configuration options for this service.
 *
 * @memberOf voyent.mailbox
 * @alias updateConfig
 * @param {Object} params params
 * @param {Object} params.config The new config.
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 * will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 * will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 * voyent.auth.connect() will be used.
 * @param {String} params.host The Voyent Services host url. If not provided, the last used Voyent host, or the
 * default will be used.
 */
export function updateConfig(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            validateRequiredConfig(params, reject);

            const url = utils.getRealmResourceURL(mailboxURL, account, realm,
                'config', token);

            put(url, params.config).then(function () {
                updateLastActiveTimestamp();
                resolve();
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

export function getMailboxResourcePermissions(params) {
    if (!params.username || params.username.length === 0) {
        return;
    }
    params.path = 'mailboxes/' + params.username + '/messages';
    return getResourcePermissions(params);
}

export function updateMailboxResourcePermissions(params) {
    if (!params.username || params.username.length === 0) {
        return;
    }
    params.path = 'mailboxes/' + params.username + '/messages';
    return getResourcePermissions(params);
}

export function getConfigResourcePermissions(params) {
    params.path = 'config';
    return getResourcePermissions(params);
}

export function updateConfigResourcePermissions(params) {
    params.path = 'config';
    return getResourcePermissions(params);
}

export function getResourcePermissions(params) {
    params.service = 'mailbox';
    return getServiceResourcePermissions(params);
}

export function updateResourcePermissions(params) {
    params.service = 'mailbox';
    return updateServiceResourcePermissions(params);
}