function QueryService(b, utils) {
    var services = b.io;

    return {

        /**
         * Create a new query
         *
         * @alias createQuery
         * @param {Object} params params
         * @param {String} params.id The query id. If not provided, the service will return a new id
         * @param {Object} params.query The query to be created
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIt host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {String} The resource URI
         */
        createQuery: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);

                    var url = getRealmResourceURL(services.queryURL, account, realm,
                        'queries/' + (params.id ? params.id : ''), token, params.ssl);

                    b.$.post(url, params.query).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function(error){
                        reject(error);
                    });

                }
            );
        },

        /**
         * Update a query
         *
         * @alias updateQuery
         * @param {Object} params params
         * @param {String} params.id The query id, the query to be updated
         * @param {Object} params.query The query
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {String} The resource URI
         */
        updateQuery: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredId(params, reject);

                    var url = getRealmResourceURL(services.queryURL, account, realm,
                        'queries/' + params.id, token, params.ssl);

                    b.$.put(url, params.query).then(function(){
                        services.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetch a query
         *
         * @alias getQuery
         * @param {Object} params params
         * @param {String} params.id The query id, the query to fetch
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {Object} The query
         */
        getQuery: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredId(params, reject);

                    var url = getRealmResourceURL(services.queryURL, account, realm,
                        'queries/' + params.id, token, params.ssl);

                    b.$.getJSON(url).then(function(query){
                        services.auth.updateLastActiveTimestamp();
                        resolve(query);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Searches for queries in a realm based on a query
         *
         * @alias findQueries
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Object} params.query A mongo query for the queries
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findQueries: function(params){
            return new Promise(
                function(resolve, reject) {

                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);

                    var url = getRealmResourceURL(services.queryURL, account, realm,
                        'queries/', token, params.ssl, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    b.$.getJSON(url).then(function(doc){
                        services.auth.updateLastActiveTimestamp();
                        resolve(doc);
                    })['catch'](function(response){
                        reject(response);
                    });

                }
            );
        },

        /**
         * Delete a query
         *
         * @alias deleteQuery
         * @param {Object} params params
         * @param {String} params.id The query id, the query to be deleted
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        deleteQuery: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredId(params, reject);

                    var url = getRealmResourceURL(services.queryURL, account, realm,
                        'queries/' + params.id, token, params.ssl);

                    b.$.doDelete(url).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        }

    };
}
