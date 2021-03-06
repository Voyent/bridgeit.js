function MailboxService(v, utils) {
    function validateRequiredMessages(params, reject) {
        utils.validateParameter('mailbox', 'The messages parameter is required', params, reject);
    }

    function validateRequiredConfig(params, reject) {
        utils.validateParameter('config', 'The config parameter is required', params, reject);
    }

    var mailbox = {
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
        createMultiUserMessages: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredMessages(params, reject);

                    var url = utils.getRealmResourceURL(v.mailboxURL, account, realm,
                        'mailboxes', token);

                    v.$.post(url, params.messages).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uris);
                    })['catch'](function (error) {
                        reject(error);
                    });

                }
            );
        },

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
        createMessages: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredMessages(params, reject);
                    utils.validateRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(v.mailboxURL, account, realm,
                        'mailboxes/' + params.username + '/messages', token);

                    v.$.post(url, params.messages).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uris);
                    })['catch'](function (error) {
                        reject(error);
                    });

                }
            );
        },

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
        getMessage: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    utils.validateRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(v.mailboxURL, account, realm,
                        'mailboxes/' + params.username + '/messages/' + params.id, token);

                    v.$.getJSON(url).then(function (message) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(message);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

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
        findMessages: function (params) {
            return new Promise(
                function (resolve, reject) {

                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(v.mailboxURL, account, realm,
                        'mailboxes/' + params.username + '/messages' + (params.type ? ('/type/' + params.type) : ''),
                        token, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function (messages) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(messages);
                    })['catch'](function (response) {
                        reject(response);
                    });

                }
            );
        },

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
        deleteMessage: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    utils.validateRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(v.mailboxURL, account, realm,
                        'mailboxes/' + params.username + '/messages/' + params.id, token);

                    v.$.doDelete(url).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

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
        deleteMessages: function (params) {
            return new Promise(
                function (resolve, reject) {

                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(v.mailboxURL, account, realm,
                        'mailboxes/' + params.username + '/messages' + (params.type ? ('/type/' + params.type) : ''),
                        token, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.doDelete(url).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

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
        getConfig: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.mailboxURL, account, realm,
                        'config', token);

                    v.$.getJSON(url).then(function (config) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(config);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

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
        updateConfig: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredConfig(params, reject);

                    var url = utils.getRealmResourceURL(v.mailboxURL, account, realm,
                        'config', token);

                    v.$.put(url, params.config).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        getMailboxResourcePermissions: function (params) {
            if (!params.username || params.username.length === 0) {
                return;
            }
            params.path = 'mailboxes/' + params.username + '/messages';
            return mailbox.getResourcePermissions(params);
        },

        updateMailboxResourcePermissions: function (params) {
            if (!params.username || params.username.length === 0) {
                return;
            }
            params.path = 'mailboxes/' + params.username + '/messages';
            return mailbox.getResourcePermissions(params);
        },

        getConfigResourcePermissions: function (params) {
            params.path = 'config';
            return mailbox.getResourcePermissions(params);
        },

        updateConfigResourcePermissions: function (params) {
            params.path = 'config';
            return mailbox.getResourcePermissions(params);
        },

        getResourcePermissions: function (params) {
            params.service = 'mailbox';
            return v.getResourcePermissions(params);
        },

        updateResourcePermissions: function (params) {
            params.service = 'mailbox';
            return v.updateResourcePermissions(params);
        }
    };

    return mailbox;
}
