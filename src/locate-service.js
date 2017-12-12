function LocateService(v, utils) {
    function validateRequiredRegion(params, reject) {
        utils.validateParameter('region', 'The region parameter is required', params, reject);
    }

    function validateRequiredMonitor(params, reject) {
        utils.validateParameter('monitor', 'The monitor parameter is required', params, reject);
    }

    function validateRequiredPOI(params, reject) {
        utils.validateParameter('poi', 'The poi parameter is required', params, reject);
    }

    function validateRequiredLocation(params, reject) {
        utils.validateParameter('location', 'The location parameter is required', params, reject);
    }

    function validateRequiredLat(params, reject) {
        utils.validateParameter('lat', 'The lat parameter is required', params, reject);
    }

    function validateRequiredLon(params, reject) {
        utils.validateParameter('lon', 'The lon parameter is required', params, reject);
    }

    function validateRequiredTracker(params, reject) {
        utils.validateParameter('tracker', 'The tracker parameter is required', params, reject);
    }

    function validateRequiredAlertTemplate(params, reject) {
        utils.validateParameter('alertTemplate', 'The alertTemplate parameter is required', params, reject);
    }

    function validateRequiredProperties(params, reject) {
        if (!params.location.location.properties || !params.location.location.properties.trackerId || !params.location.location.properties.zoneNamespace) {
            reject(Error('The properties trackerId and zoneNamespace are required'));
        }
    }

    function validateRequiredAlertProperties(params, reject) {
        if (!params.location.location.properties || !params.location.location.properties.alertId) {
            reject(Error('The property alertId is required'));
        }
    }

    function validateRequiredZoneNamespace(params, reject) {
        utils.validateParameter('zoneNamespace', 'The zoneNamespace is required', params, reject);
    }

    function validateRequiredState(params, reject) {
        utils.validateParameter('state', 'The state is required', params, reject);
    }


    var locate = {
        /**
         * Create a new region.
         *
         * @memberOf voyent.locate
         * @alias createRegion
         * @param {Object} params params
         * @param {String} params.id The region id. If not provided, the service will return a new id
         * @param {Object} params.region The region geoJSON document that describes the region to be created
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {String} The resource URI
         */
        createRegion: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredRegion(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'regions/' + (params.id ? params.id : ''), token, params.ssl);

                    v.$.post(url, params.region).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Update a region.
         *
         * @memberOf voyent.locate
         * @alias updateRegion
         * @param {Object} params params
         * @param {String} params.id The region id, the region to be updated
         * @param {Object} params.region The new region
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        updateRegion: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredRegion(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'regions/' + params.id, token, params.ssl);

                    v.$.put(url, params.region).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete a new region.
         *
         * @memberOf voyent.locate
         * @alias deleteRegion
         * @param {Object} params params
         * @param {String} params.id The region id.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        deleteRegion: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'regions/' + params.id, token, params.ssl);

                    v.$.doDelete(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetches all saved regions for the realm.
         *
         * @memberOf voyent.locate
         * @alias getAllRegions
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {Object} The results
         */
        getAllRegions: function (params) {
            return new Promise(
                function (resolve, reject) {

                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'regions', token, params.ssl);

                    v.$.getJSON(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Searches for regions in a realm based on a query.
         *
         * @memberOf voyent.locate
         * @alias findRegions
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Object} params.query A mongo query for the regions
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findRegions: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);
                    
                    // Set 'nostore' to ensure the following checks don't update our lastKnown calls
                    params.nostore = true;

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'regions', token, params.ssl, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        if (error.status === 404) {
                            resolve();
                        }
                        else {
                            reject(error);
                        }
                    });
                }
            );
        },

        /**
         * Searches for monitors in a realm based on a query.
         *
         * @memberOf voyent.locate
         * @alias findMonitors
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Object} params.query A mongo query for the monitors
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findMonitors: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'monitors', token, params.ssl, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        if (error.status === 404) {
                            resolve();
                        }
                        else {
                            reject(error);
                        }
                    });
                }
            );
        },

        /**
         * Create a new location monitor.
         *
         * @memberOf voyent.locate
         * @alias createMonitor
         * @param {Object} params params
         * @param {String} params.id The monitor id. If not provided, the service will return a new id
         * @param {Object} params.monitor The monitor document that describes the monitor to be created
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {String} The resource URI
         */
        createMonitor: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredMonitor(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'monitors' + (params.id ? '/' + params.id : ''), token, params.ssl);

                    v.$.post(url, params.monitor).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete a new monitor.
         *
         * @memberOf voyent.locate
         * @alias deleteMonitor
         * @param {Object} params params
         * @param {String} params.id The region id.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        deleteMonitor: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'monitors/' + params.id, token, params.ssl);

                    v.$.doDelete(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetches all saved monitors for the realm.
         *
         * @memberOf voyent.locate
         * @alias getAllMonitors
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {Object} The results
         */
        getAllMonitors: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'monitors', token, params.ssl);

                    v.$.getJSON(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Create a new location point of interest.
         *
         * @memberOf voyent.locate
         * @alias createPOI
         * @param {Object} params params
         * @param {String} params.id The POI id. If not provided, the service will return a new id
         * @param {Object} params.poi The POI document that describes the POI to be created
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {String} The resource URI
         */
        createPOI: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredPOI(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'poi' + (params.id ? '/' + params.id : ''), token, params.ssl);

                    v.$.post(url, params.poi).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Update a poi.
         *
         * @memberOf voyent.locate
         * @alias updatePOI
         * @param {Object} params params
         * @param {String} params.id The poi id, the poi to be updated
         * @param {Object} params.poi The new poi
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        updatePOI: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredPOI(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'poi/' + params.id, token, params.ssl);

                    v.$.put(url, params.poi).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Searches for POIs in a realm based on a query.
         *
         * @memberOf voyent.locate
         * @alias findPOIs
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Object} params.query A mongo query for the points of interest
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findPOIs: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'poi', token, params.ssl, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        if (error.status === 404) {
                            resolve();
                        }
                        else {
                            reject(error);
                        }
                    });
                }
            );
        },

        /**
         * Delete a new POI.
         *
         * @memberOf voyent.locate
         * @alias deletePOI
         * @param {Object} params params
         * @param {String} params.id The POI id.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        deletePOI: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'poi/' + params.id, token, params.ssl);

                    v.$.doDelete(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetches all saved POIs for the realm.
         *
         * @memberOf voyent.locate
         * @alias getAllPOIs
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {Object} The results
         */
        getAllPOIs: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'poi', token, params.ssl);

                    v.$.getJSON(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Searches for locations in a realm based on a query.
         *
         * @memberOf voyent.locate
         * @alias findLocations
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Object} params.query A mongo query for the locations
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findLocations: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'locations', token, params.ssl, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        if (error.status === 404) {
                            resolve();
                        }
                        else {
                            reject(error);
                        }
                    });
                }
            );
        },

        /**
         * Update the location of the current user.
         *
         * @memberOf voyent.locate
         * @alias updateLocation
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Object} params.location The location
         */
        updateLocation: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredLocation(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'locations', token, params.ssl);

                    v.$.post(url, params.location).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Set the current users location with a latitude and longitude.
         *
         * @memberOf voyent.locate
         * @alias updateLocationCoordinates
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Number} params.lat The location latitude
         * @param {Number} params.lon The location longitude
         * @param {String} params.label An optional label
         */
        updateLocationCoordinates: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredLat(params, reject);
                    validateRequiredLon(params, reject);

                    var location = {
                        location: {
                            geometry: {
                                type: 'Point',
                                coordinates: [params.lon, params.lat]
                            },
                            properties: {
                                timestamp: new Date().toISOString()
                            }
                        }
                    };

                    if (params.label) {
                        location.label = params.label;
                    }

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'locations', token, params.ssl);

                    v.$.post(url, location).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Get the last known user location from the location service.
         *
         * @memberOf voyent.locate
         * @alias getLastUserLocation
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {String} params.username
         * @returns {Object} The single result, if any, of the user location.
         http://dev.voyent.cloud/locate/bsrtests/realms/test/locations
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

        getLastUserLocation: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'locations/', token, params.ssl, {
                            "query": {"username": params.username},
                            "options": {"sort": {"lastUpdated": -1}, "limit": 1}
                        });

                    v.$.getJSON(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response[0] || null);
                    })['catch'](function (response) {
                        if (response.status === 403) {
                            resolve(null);
                        }
                        else {
                            reject(response);
                        }
                    });
                }
            );
        },

        /**
         * Delete a location.
         *
         * @memberOf voyent.locate
         * @alias deleteLocation
         * @param {Object} params params
         * @param {String} params.id The location id.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        deleteLocation: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'locations/' + params.id, token, params.ssl);

                    v.$.doDelete(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete locations based on a query.
         *
         * @memberOf voyent.locate
         * @alias deleteLocations
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Object} params.query A mongo query for the locations.
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set.
         * @param {Object} params.options Additional query options such as limit and sort.
         */
        deleteLocations: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'locations/', token, params.ssl, {
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
         * Create a new tracker.
         *
         * @memberOf voyent.location
         * @alias createTracker
         * @param {Object} params params
         * @param {String} params.id The tracker id. If not provided, the service will return a new id
         * @param {Object} params.tracker The tracker geoJSON document that describes the tracker to be created
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {String} The resource URI
         */
        createTracker: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredTracker(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'trackers/' + (params.id ? encodeURIComponent(params.id) : ''), token, params.ssl);

                    v.$.post(url, params.tracker).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Update a tracker.
         *
         * @memberOf voyent.location
         * @alias updateTracker
         * @param {Object} params params
         * @param {String} params.id The tracker id, the tracker to be updated
         * @param {Object} params.tracker The new tracker
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        updateTracker: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredTracker(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'trackers/' + encodeURIComponent(params.id), token, params.ssl);

                    v.$.put(url, params.tracker).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete a tracker.
         *
         * @memberOf voyent.location
         * @alias deleteTracker
         * @param {Object} params params
         * @param {String} params.id The tracker id.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        deleteTracker: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'trackers/' + encodeURIComponent(params.id), token, params.ssl);

                    v.$.doDelete(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete a tracker instance.
         *
         * @memberOf voyent.location
         * @alias deleteTrackerInstance
         * @param {Object} params params
         * @param {String} params.id The id of the tracker template that the instance was created from.
         * @param {String} params.zoneNamespace The tracker instance name.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        deleteTrackerInstance: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredZoneNamespace(params, reject);

                    var resourceId = encodeURIComponent(params.id + '.' + params.zoneNamespace);
                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'trackers/instances/' + resourceId, token, params.ssl);

                    v.$.doDelete(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Searches for Tracker in a realm based on a query.
         *
         * @memberOf voyent.location
         * @alias findTrackers
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Object} params.query A mongo query for the points of interest
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findTrackers: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'trackers', token, params.ssl, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        if (error.status === 404) {
                            resolve();
                        }
                        else {
                            reject(error);
                        }
                    });
                }
            );
        },

        /**
         * Fetches all saved Trackers for the realm.
         *
         * @memberOf voyent.location
         * @alias getAllTrackers
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {Object} The results
         */
        getAllTrackers: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'trackers/', token, params.ssl);

                    v.$.getJSON(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Update the location of a tracker.
         *
         * @memberOf voyent.locate
         * @alias updateTrackerLocation
         * @param {Object} params params
         * @param {String} params.id The tracker id
         * @param {Object} params.location The location, must include location.properties.trackerId and location.properties.zoneNamespace.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        updateTrackerLocation: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredLocation(params, reject);
                    validateRequiredProperties(params, reject);
                    params.location.location.type = "Feature"; //make sure we have the type set

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'locations', token, params.ssl);

                    v.$.post(url, params.location).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Create a new alert template.
         *
         * @memberOf voyent.location
         * @alias createAlertTemplate
         * @param {Object} params params
         * @param {String} params.id The alert template id. If not provided, the service will return a new id.
         * @param {Object} params.alertTemplate The alert template GeoJSON document.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {String} The resource URI
         */
        createAlertTemplate: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredAlertTemplate(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                              'alerts/' + (params.id ? encodeURIComponent(params.id) : ''), token, params.ssl);

                    v.$.post(url, params.alertTemplate).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Update an alert template.
         *
         * @memberOf voyent.location
         * @alias updateAlertTemplate
         * @param {Object} params params
         * @param {String} params.id The alert template id, the alert template to be updated.
         * @param {Object} params.alertTemplate The new alert template GeoJSON document.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        updateAlertTemplate: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredAlertTemplate(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'alerts/' + encodeURIComponent(params.id), token, params.ssl);

                    v.$.put(url, params.alertTemplate).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Delete an alert template.
         *
         * @memberOf voyent.location
         * @alias deleteAlertTemplate
         * @param {Object} params params
         * @param {String} params.id The id of alert template to be deleted.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        deleteAlertTemplate: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'alerts/' + encodeURIComponent(params.id), token, params.ssl);

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
         * Search for alert templates based on a query.
         *
         * @memberOf voyent.location
         * @alias findAlertTemplates
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Object} params.query A mongo query for the alert templates.
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findAlertTemplates: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);
                    
                    // Set 'nostore' to ensure the following checks don't update our lastKnown calls
                    params.nostore = true;

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'alerts', token, params.ssl, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        if (error.status === 404) {
                            resolve();
                        }
                        else {
                            reject(error);
                        }
                    });
                }
            );
        },

        /**
         * Update the location of an alert.
         *
         * @memberOf voyent.locate
         * @alias updateAlertLocation
         * @param {Object} params params
         * @param {Object} params.location The location, must include the location.properties.alertId property.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        updateAlertLocation: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredLocation(params, reject);
                    validateRequiredAlertProperties(params, reject);
                    params.location.location.type = "Feature"; //Always set the GeoJSON type.

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'locations', token, params.ssl);

                    v.$.post(url, params.location).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Deletes an alert instance.
         *
         * @memberOf voyent.location
         * @alias deleteAlert
         * @param {Object} params params
         * @param {String} params.id The id of the alert template that the instance was created from.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        deleteAlert: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'alerts/instances/' + encodeURIComponent(params.id), token, params.ssl);

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
         * Change the state of an alert.
         *
         * @memberOf voyent.locate
         * @alias updateAlertState
         * @param {Object} params params
         * @param {String} params.id The alert id, the alert whose state will be changed.
         * @param {Object} params.state The new alert state. One of draft, preview, active, deprecated, ended.
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        updateAlertState: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);
                    validateRequiredState(params, reject);

                    var url = utils.getRealmResourceURL(v.locateURL, account, realm,
                        'alerts/'+ encodeURIComponent(params.id)+'/state', token, params.ssl);

                    v.$.put(url, {"state":params.state}).then(function () {
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        getRegionResourcePermissions: function (params) {
            params.path = 'regions';
            return locate.getResourcePermissions(params);
        },

        updateRegionResourcePermissions: function (params) {
            params.path = 'regions';
            return locate.updateResourcePermissions(params);
        },

        getPOIResourcePermissions: function (params) {
            params.path = 'poi';
            return locate.getResourcePermissions(params);
        },

        updatePOIResourcePermissions: function (params) {
            params.path = 'poi';
            return locate.updateResourcePermissions(params);
        },

        getAlertResourcePermissions: function (params) {
            params.path = 'alert';
            return locate.getResourcePermissions(params);
        },

        updateAlertResourcePermissions: function (params) {
            params.path = 'alert';
            return locate.updateResourcePermissions(params);
        },

        getResourcePermissions: function (params) {
            params.service = 'locate';
            return v.getResourcePermissions(params);
        },

        updateResourcePermissions: function (params) {
            params.service = 'locate';
            return v.updateResourcePermissions(params);
        }
    };

    return locate;
}
