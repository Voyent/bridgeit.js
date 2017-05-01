function MetricsService(b, utils) {
    function validateRequiredEvent(params, reject){
        utils.validateParameter('event', 'The event parameter is required', params, reject);
    }

    var services = b.io;

    return {

        /**
         * Searches for events in a realm based on a query
         *
         * @alias findEvents
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Object} params.query A mongo query for the events
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findEvents: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(services.metricsURL, account, realm,
                        'events', token, params.ssl, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    b.$.getJSON(url).then(function(events){
                        services.auth.updateLastActiveTimestamp();
                        resolve(events);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Store a custom event in the metrics service.
         *
         * @alias createCustomEvent
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Object} params.event The custom event that you would like to store, in JSON format.
         * @returns {String} The resource URI
         */
        createCustomEvent: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredEvent(params, reject);

                    var url = utils.getRealmResourceURL(services.metricsURL, account, realm,
                        'events', token, params.ssl);

                    b.$.post(url, params.event).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Retrieve the time difference in milliseconds between the provided time and the metrics server time.
         *
         * Useful for displaying accurate live metrics views. The time difference is returned as client time - server time.
         *
         * @alias getClientServerTimeGap
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {Number} The time difference in milliseconds
         */
        getClientServerTimeGap: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(services.metricsURL, account, realm,
                        'time', token, params.ssl, {
                            clientTime: encodeURIComponent(new Date().toISOString())
                        });

                    b.$.getJSON(url).then(function(response){
                        if( response.timeOffset){
                            services.auth.updateLastActiveTimestamp();
                            resolve(response.timeOffset);
                        }
                        else{
                            reject(new Error('getClientServerTimeGap() could not parse response: ' +
                                JSON.stringify(response)));
                        }
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        }


    };
}
