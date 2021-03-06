function ActionService(v, utils) {
    function validateRequiredAction(params, reject) {
        utils.validateParameter('action', 'The action parameter is required', params, reject);
    }

    return {
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
        executeAction: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.actionURL, account, realm,
                        'actions/' + params.id, token, {'op': 'exec'});

                    v.$.post(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        reject(error);
                    });

                }
            );
        },

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
        createAction: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredAction(params, reject);

                    var url = utils.getRealmResourceURL(v.actionURL, account, realm,
                        'actions/' + params.id, token);

                    v.$.post(url, params.action).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function (error) {
                        reject(error);
                    });

                }
            );
        },

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
        updateAction: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredAction(params, reject);

                    var url = utils.getRealmResourceURL(v.actionURL, account, realm,
                        'actions/' + params.id, token);

                    v.$.put(url, params.action).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

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
        getAction: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.actionURL, account, realm,
                        'actions/' + params.id, token);

                    v.$.getJSON(url).then(function (action) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(action);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

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
        findActions: function (params) {
            return new Promise(
                function (resolve, reject) {

                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.actionURL, account, realm,
                        'actions/', token, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function (actions) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(actions);
                    })['catch'](function (response) {
                        reject(response);
                    });

                }
            );
        },

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
        deleteAction: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.actionURL, account, realm,
                        'actions/' + params.id, token);

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
        getTaskGroups: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.actionURL, account, realm,
                        'taskGroups/', token);

                    v.$.getJSON(url).then(function (tasksGroups) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(tasksGroups);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

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
        getTasks: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.actionURL, account, realm,
                        'tasks/', token);

                    v.$.getJSON(url).then(function (tasks) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(tasks);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

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
        executeModule: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var moduleParams = {};
                    if (params.params && typeof params.params === 'object' && Object.keys(params.params).length) {
                        moduleParams = params.params;
                    }

                    var url = utils.getRealmResourceURL(v.actionURL, account, realm,
                        'modules/' + params.id, token);

                    v.$.post(url, moduleParams).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        reject(error);
                    });

                }
            );
        },

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
        uploadFilesToModule: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    utils.validateParameter('files', 'The files parameter is required', params, reject);

                    var formData = new FormData();
                    if (params.files.length) {
                        for (var i=0; i<params.files.length; i++) {
                            formData.append('file'+(i+1), params.files[i]);
                        }
                    }
                    else {
                        return reject((Error('The files parameter is empty')));
                    }

                    var url = utils.getRealmResourceURL(v.actionURL, account, realm,
                        'modules/' + params.id, token);

                    v.$.post(url, formData, null, true, null, params.progressCb).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        reject(error);
                    });

                }
            );
        },

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
        getPreviewMetrics: function(params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.actionURL, account, realm,
                        'previewMetrics/' + params.id, token);

                    v.$.getJSON(url).then(function(previewMetrics) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(previewMetrics);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

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
        getNotificationHistory: function(params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.actionURL, account, realm,
                        'notificationHistory/' + params.id, token);

                    v.$.getJSON(url).then(function(notificationHistory) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(notificationHistory);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        getResourcePermissions: function (params) {
            params.service = 'action';
            params.path = 'actions';
            return v.getResourcePermissions(params);
        },

        updateResourcePermissions: function (params) {
            params.service = 'action';
            params.path = 'actions';
            return v.updateResourcePermissions(params);
        }
    };
}
