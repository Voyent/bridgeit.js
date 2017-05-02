function EventHubService (v, utils) {
    function validateRequiredHandler(params, reject){
        utils.validateParameter('handler', 'The handler parameter is required', params, reject);
    }

    function validateRequiredRecognizer(params, reject){
        utils.validateParameter('handler', 'The recognizer parameter is required', params, reject);
    }

    return {
        /**
         * Create a new event handler
         *
         * @alias createHandler
         * @param {Object} params params
         * @param {String} params.id The handler id
         * @param {Object} params.handler The event handler to be created
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIt host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {String} The resource URI
         */
        createHandler: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredHandler(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'handlers/' + (params.id ? params.id : ''), token, params.ssl);

                    v.$.post(url, params.handler).then(function(response){
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function(error){
                        reject(error);
                    });

                }
            );
        },

        /**
         * Update an event handler
         *
         * @alias updateHandler
         * @param {Object} params params
         * @param {String} params.id The handler id, the event handler to be updated
         * @param {Object} params.handler The new event handler
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        updateHandler: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredHandler(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'handlers/' + params.id, token, params.ssl);

                    v.$.put(url, params.handler).then(function(){
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetch an event handler
         *
         * @alias getHandler
         * @param {Object} params params
         * @param {String} params.id The handler id, the event handler to fetch
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {Object} The event handler
         */
        getHandler: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'handlers/' + params.id, token, params.ssl);

                    v.$.getJSON(url).then(function(handler){
                        v.auth.updateLastActiveTimestamp();
                        resolve(handler);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Searches for event handlers in a realm based on a query
         *
         * @alias findHandlers
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Object} params.query A mongo query for the event handlers
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findHandlers: function(params){
            return new Promise(
                function(resolve, reject) {

                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'handlers/', token, params.ssl, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function(handlers){
                        v.auth.updateLastActiveTimestamp();
                        resolve(handlers);
                    })['catch'](function(response){
                        reject(response);
                    });

                }
            );
        },

        /**
         * Delete an event handler
         *
         * @alias deleteHandler
         * @param {Object} params params
         * @param {String} params.id The handler id, the event handler to be deleted
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        deleteHandler: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'handlers/' + params.id, token, params.ssl);

                    v.$.doDelete(url).then(function(){
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete event handlers in a realm based on a query
         *
         * @alias deleteHandlers
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Object} params.query A mongo query for the event handlers
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         */
        deleteHandlers: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'handlers/', token, params.ssl, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.doDelete(url).then(function(){
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Create a new event recognizer
         *
         * @alias createRecognizer
         * @param {Object} params params
         * @param {String} params.id The recognizer id
         * @param {Object} params.recognizer The event recognizer to be created
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIt host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {String} The resource URI
         */
        createRecognizer: function(params) {
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredRecognizer(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'recognizers/' + (params.id ? params.id : ''), token, params.ssl);

                    v.$.post(url, params.recognizer).then(function(response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function(error) {
                        reject(error);
                    });

                }
            );
        },

        /**
         * Update an event recognizer
         *
         * @alias updateRecognizer
         * @param {Object} params params
         * @param {String} params.id The recognizer id, the event recognizer to be updated
         * @param {Object} params.recognizer The new event recognizer
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        updateRecognizer: function(params) {
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredRecognizer(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'recognizers/' + params.id, token, params.ssl);

                    v.$.put(url, params.recognizer).then(function() {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetch an event recognizer
         *
         * @alias getRecognizer
         * @param {Object} params params
         * @param {String} params.id The recognizer id, the event recognizer to fetch
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {Object} The event recognizer
         */
        getRecognizer: function(params) {
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'recognizers/' + params.id, token, params.ssl);

                    v.$.getJSON(url).then(function(recognizer) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(recognizer);
                    })['catch'](function(error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Searches for event recognizers in a realm based on a query
         *
         * @alias findRecognizers
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Object} params.query A mongo query for the event recognizers
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findRecognizers: function(params) {
            return new Promise(
                function(resolve, reject) {

                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'recognizers/', token, params.ssl, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function(recognizers) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(recognizers);
                    })['catch'](function(response) {
                        reject(response);
                    });

                }
            );
        },

        /**
         * Delete an event recognizer
         *
         * @alias deleteRecognizer
         * @param {Object} params params
         * @param {String} params.id The recognizer id, the event recognizer to be deleted
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        deleteRecognizer: function(params) {
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'recognizers/' + params.id, token, params.ssl);

                    v.$.doDelete(url).then(function() {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete event recognizers in a realm based on a query
         *
         * @alias deleteRecognizers
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Object} params.query A mongo query for the event recognizers
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         */
        deleteRecognizers: function(params) {
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.eventhubURL, account, realm,
                        'recognizers/', token, params.ssl, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.doDelete(url).then(function() {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error) {
                        reject(error);
                    });
                }
            );
        }
    };
}