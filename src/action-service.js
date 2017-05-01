function ActionService(b, utils) {
    function validateRequiredAction(params, reject){
        utils.validateParameter('action', 'The action parameter is required', params, reject);
    }

    var services = b.io;

    return {
        /**
         * Execute an action
         *
         * @alias executeAction
         * @param {Object} params params
         * @param {String} params.id The action id, the action to be executed
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIt host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {String} The resource URI
         */
        executeAction: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(services.actionURL, account, realm,
                        'actions/' + params.id, token, params.ssl, {'op': 'exec'});

                    b.$.post(url).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function(error){
                        reject(error);
                    });

                }
            );
        },

        /**
         * Create a new action
         *
         * @alias createAction
         * @param {Object} params params
         * @param {String} params.id The action id
         * @param {Object} params.action The action to be created
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIt host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {String} The resource URI
         */
        createAction: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredAction(params, reject);

                    var url = utils.getRealmResourceURL(services.actionURL, account, realm,
                        'actions/' + params.id, token, params.ssl);

                    b.$.post(url, params.action).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function(error){
                        reject(error);
                    });

                }
            );
        },

        /**
         * Update an action
         *
         * @alias updateAction
         * @param {Object} params params
         * @param {String} params.id The action id, the action to be updated
         * @param {Object} params.action The new action
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        updateAction: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredAction(params, reject);

                    var url = utils.getRealmResourceURL(services.actionURL, account, realm,
                        'actions/' + params.id, token, params.ssl);

                    b.$.put(url, params.action).then(function(){
                        services.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetch an action
         *
         * @alias getAction
         * @param {Object} params params
         * @param {String} params.id The action id, the action to fetch
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {Object} The action
         */
        getAction: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(services.actionURL, account, realm,
                        'actions/' + params.id, token, params.ssl);

                    b.$.getJSON(url).then(function(action){
                        services.auth.updateLastActiveTimestamp();
                        resolve(action);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Searches for actions in a realm based on a query
         *
         * @alias findActions
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Object} params.query A mongo query for the actions
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findActions: function(params){
            return new Promise(
                function(resolve, reject) {

                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(services.actionURL, account, realm,
                        'actions/', token, params.ssl, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    b.$.getJSON(url).then(function(actions){
                        services.auth.updateLastActiveTimestamp();
                        resolve(actions);
                    })['catch'](function(response){
                        reject(response);
                    });

                }
            );
        },

        /**
         * Delete an action
         *
         * @alias deleteAction
         * @param {Object} params params
         * @param {String} params.id The action id, the action to be deleted
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        deleteAction: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(services.actionURL, account, realm,
                        'actions/' + params.id, token, params.ssl);

                    b.$.doDelete(url).then(function(){
                        services.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetch available task groups
         *
         * @alias getTaskGroups
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {Object} The task group schemas
         */
        getTaskGroups: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(services.actionURL, account, realm,
                        'taskGroups/', token, params.ssl);

                    b.$.getJSON(url).then(function(tasksGroups){
                        services.auth.updateLastActiveTimestamp();
                        resolve(tasksGroups);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetch available tasks
         *
         * @alias getTasks
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {Object} The action
         */
        getTasks: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(services.actionURL, account, realm,
                        'tasks/', token, params.ssl);

                    b.$.getJSON(url).then(function(tasks){
                        services.auth.updateLastActiveTimestamp();
                        resolve(tasks);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        }
    };
}
