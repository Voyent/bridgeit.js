function LocateService(b, utils) {
    function validateRequiredRegion(params, reject){
        utils.validateParameter('region', 'The region parameter is required', params, reject);
    }

    function validateRequiredMonitor(params, reject){
        utils.validateParameter('monitor', 'The monitor parameter is required', params, reject);
    }

    function validateRequiredPOI(params, reject){
        utils.validateParameter('poi', 'The poi parameter is required', params, reject);
    }

    function validateRequiredLocation(params, reject){
        utils.validateParameter('location', 'The location parameter is required', params, reject);
    }

    function validateRequiredLat(params, reject){
        utils.validateParameter('lat', 'The lat parameter is required', params, reject);
    }

    function validateRequiredLon(params, reject){
        utils.validateParameter('lon', 'The lon parameter is required', params, reject);
    }

    var services = b.io;

    return {
        /**
         * Create a new region
         *
         * @alias createRegion
         * @param {Object} params params
         * @param {String} params.id The region id. If not provided, the service will return a new id
         * @param {Object} params.region The region geoJSON document that describes the region to be created
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {String} The resource URI
         */
        createRegion: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredRegion(params, reject);

                    var url = getRealmResourceURL(services.locateURL, account, realm,
                        'regions/' + (params.id ? params.id : ''), token, params.ssl);

                    b.$.post(url, params.region).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Update a region
         *
         * @alias updateRegion
         * @param {Object} params params
         * @param {String} params.id The region id, the region to be updated
         * @param {Object} params.region The new region
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        updateRegion: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredId(params, reject);
                    validateRequiredRegion(params, reject);

                    var url = getRealmResourceURL(services.locateURL, account, realm,
                        'regions/' + params.id, token, params.ssl);

                    b.$.put(url, params.region).then(function(){
                        services.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete a new region
         *
         * @alias deleteRegion
         * @param {Object} params params
         * @param {String} params.id The region id.
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        deleteRegion: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredId(params, reject);

                    var url = getRealmResourceURL(services.locateURL, account, realm,
                        'regions/' + params.id, token, params.ssl);

                    b.$.doDelete(url).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetches all saved regions for the realm
         *
         * @alias getAllRegions
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {Object} The results
         */
        getAllRegions: function(params){
            return new Promise(
                function(resolve, reject) {

                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);

                    var url = getRealmResourceURL(services.locateURL, account, realm,
                        'regions', token, params.ssl);

                    b.$.getJSON(url).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Searches for regions in a realm based on a query
         *
         * @alias findRegions
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Object} params.query A mongo query for the regions
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findRegions: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);

                    var url = getRealmResourceURL(services.locateURL, account, realm,
                        'regions', token, params.ssl, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    b.$.getJSON(url).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function(error){
                        if( error.status === 404 ){
                            resolve();
                        }
                        else{
                            reject(error);
                        }
                    });
                }
            );
        },

        /**
         * Searches for monitors in a realm based on a query
         *
         * @alias findMonitors
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Object} params.query A mongo query for the monitors
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findMonitors: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);

                    var url = getRealmResourceURL(services.locateURL, account, realm,
                        'monitors', token, params.ssl, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    b.$.getJSON(url).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function(error){
                        if( error.status === 404 ){
                            resolve();
                        }
                        else{
                            reject(error);
                        }
                    });
                }
            );
        },

        /**
         * Create a new location monitor
         *
         * @alias createMonitor
         * @param {Object} params params
         * @param {String} params.id The monitor id. If not provided, the service will return a new id
         * @param {Object} params.monitor The monitor document that describes the monitor to be created
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {String} The resource URI
         */
        createMonitor: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredMonitor(params, reject);

                    var url = getRealmResourceURL(services.locateURL, account, realm,
                        'monitors' + (params.id ? '/' + params.id : ''), token, params.ssl);

                    b.$.post(url, params.monitor).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete a new monitor
         *
         * @alias deleteMonitor
         * @param {Object} params params
         * @param {String} params.id The region id.
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        deleteMonitor: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredId(params, reject);

                    var url = getRealmResourceURL(services.locateURL, account, realm,
                        'monitors/' + params.id, token, params.ssl);

                    b.$.doDelete(url).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetches all saved monitors for the realm
         *
         * @alias getAllMonitors
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {Object} The results
         */
        getAllMonitors: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);

                    var url = getRealmResourceURL(services.locateURL, account, realm,
                        'monitors', token, params.ssl);

                    b.$.getJSON(url).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Create a new location point of interest
         *
         * @alias createPOI
         * @param {Object} params params
         * @param {String} params.id The POI id. If not provided, the service will return a new id
         * @param {Object} params.poi The POI document that describes the POI to be created
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {String} The resource URI
         */
        createPOI: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredPOI(params, reject);

                    var url = getRealmResourceURL(services.locateURL, account, realm,
                        'poi' + (params.id ? '/' + params.id : ''), token, params.ssl);

                    b.$.post(url, params.poi).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Update a poi
         *
         * @alias updatePOI
         * @param {Object} params params
         * @param {String} params.id The poi id, the poi to be updated
         * @param {Object} params.poi The new poi
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        updatePOI: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredId(params, reject);
                    validateRequiredPOI(params, reject);

                    var url = getRealmResourceURL(services.locateURL, account, realm,
                        'poi/' + params.id, token, params.ssl);

                    b.$.put(url, params.poi).then(function(){
                        services.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Searches for POIs in a realm based on a query
         *
         * @alias findPOIs
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Object} params.query A mongo query for the points of interest
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findPOIs: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);

                    var url = getRealmResourceURL(services.locateURL, account, realm,
                        'poi', token, params.ssl, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    b.$.getJSON(url).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function(error){
                        if( error.status === 404 ){
                            resolve();
                        }
                        else{
                            reject(error);
                        }
                    });
                }
            );
        },

        /**
         * Delete a new POI
         *
         * @alias deletePOI
         * @param {Object} params params
         * @param {String} params.id The POI id.
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        deletePOI: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredId(params, reject);

                    var url = getRealmResourceURL(services.locateURL, account, realm,
                        'poi/' + params.id, token, params.ssl);

                    b.$.doDelete(url).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetches all saved POIs for the realm
         *
         * @alias getAllPOIs
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {Object} The results
         */
        getAllPOIs: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);

                    var url = getRealmResourceURL(services.locateURL, account, realm,
                        'poi', token, params.ssl);

                    b.$.getJSON(url).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Searches for locations in a realm based on a query
         *
         * @alias findLocations
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Object} params.query A mongo query for the locations
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findLocations: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);

                    var url = getRealmResourceURL(services.locateURL, account, realm,
                        'locations', token, params.ssl, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    b.$.getJSON(url).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function(error){
                        if( error.status === 404 ){
                            resolve();
                        }
                        else{
                            reject(error);
                        }
                    });
                }
            );
        },

        /**
         * Update the location of the current user.
         *
         * @alias updateLocation
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Object} params.location The location
         */
        updateLocation: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredLocation(params, reject);

                    var url = getRealmResourceURL(services.locateURL, account, realm,
                        'locations', token, params.ssl);

                    b.$.post(url, params.location).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Set the current users location with a latitude and longitude
         *
         * @alias updateLocationCoordinates
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Number} params.latitude The location latitude
         * @param {Number} params.longitude The location longitude
         * @param {String} params.label An optional label
         */
        updateLocationCoordinates: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredLat(params, reject);
                    validateRequiredLon(params, reject);

                    var location = {
                        location: {
                            geometry: {
                                type: 'Point',
                                coordinates: [ params.lon, params.lat ]
                            },
                            properties: {
                                timestamp: new Date().toISOString()
                            }
                        }
                    };

                    if( params.label ){
                        location.label = params.label;
                    }

                    var url = getRealmResourceURL(services.locateURL, account, realm,
                        'locations', token, params.ssl);

                    b.$.post(url, location).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },


        /**
         * Get the last known user location from the location service.
         *
         * @alias getLastUserLocation
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {String} params.username
         * @returns {Object} The single result, if any, of the user location.


         http://dev.bridgeit.io/locate/bsrtests/realms/test/locations
         ?access_token=4be2fc2f-a53b-4987-9446-88d519faaa77
         &query={%22username%22:%22user%22}
         &options={%22sort%22:[[%22lastUpdated%22,%22desc%22]]}
         &results=one

         var locationURL = apiURL + '/locations' +
         '?access_token=' + encodeURIComponent(bsr.auth.getCurrentToken()) +
         '&query={"username": "' + encodeURIComponent(user) + '"} +' +
         '&options={"sort":[["lastUpdated","desc"]]}' +
         '&results=one';
         */

        getLastUserLocation: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);
                    var username = utils.validateAndReturnRequiredUsername(params, reject);

                    var url = getRealmResourceURL(services.locateURL, account, realm,
                        'locations/' + username, token, params.ssl, {
                            'results': 'last'
                        });

                    b.$.getJSON(url).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function(response){
                        if( response.status === 403 ){
                            resolve(null);
                        }
                        else{
                            reject(response);
                        }
                    });
                }
            );
        }
    };
}
