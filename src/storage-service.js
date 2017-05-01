function StorageService(b, utils) {
    function validateRequiredBlob(params, reject){
        utils.validateParameter('blob', 'The blob parameter is required', params, reject);
    }

    function validateRequiredFile(params, reject){
        utils.validateParameter('file', 'The file parameter is required', params, reject);
    }

    var services = b.io;

    return {

        /**
         * Retrieve the storage meta info for the realm
         *
         * @alias getMetaInfo
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {String} params.scope (default 'self') 'all' or 'self', return meta information for blobs belonging to all users, or only those belonging to the current user
         * @returns {Object} The results
         */
        getMetaInfo: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                services.checkHost(params);

                //validate
                var account = validateAndReturnRequiredAccount(params, reject);
                var realm = validateAndReturnRequiredRealm(params, reject);
                var token = validateAndReturnRequiredAccessToken(params, reject);

                var url = getRealmResourceURL(services.storageURL, account, realm,
                    'meta', token, params.ssl, params.scope ? {scope: params.scope} : null);


                b.$.getJSON(url).then(function(response){
                    services.auth.updateLastActiveTimestamp();
                    resolve(response.directory);
                })['catch'](function(error){
                    reject(error);
                });
            });
        },

        /**
         * Stores a blob
         *
         * @alias uploadBlob
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.id The blob id. If not provided, the service will return a new id
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Object} params.blob The Blob to store
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Function} params.progressCallback The callback function to call on progress events. eg. function progressCallback(percentComplete, xhr){..}
         * @returns {Object} The results
         */
        uploadBlob: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                services.checkHost(params);

                //validate
                var account = validateAndReturnRequiredAccount(params, reject);
                var realm = validateAndReturnRequiredRealm(params, reject);
                var token = validateAndReturnRequiredAccessToken(params, reject);
                validateRequiredBlob(params, reject);

                var formData = new FormData();
                formData.append('file', params.blob);

                var url = getRealmResourceURL(services.storageURL, account, realm,
                    'blobs' + (params.id ? '/' + params.id : ''), token, params.ssl);

                b.$.post(url, formData, null, true, null, params.progressCallback).then(function(response){
                    services.auth.updateLastActiveTimestamp();
                    resolve(response.location || response.uri);
                })['catch'](function(error){
                    reject(error);
                });
            });
        },

        /**
         * Stores a file
         *
         * @alias uploadBlob
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.id The blob id. If not provided, the service will return a new id
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Object} params.file The Blob to store
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Function} params.progressCallback The callback function to call on progress events. eg. function progressCallback(percentComplete, xhr){..}
         * @param {Function} params.onabort The callback for the XMLHttpRequest onabort event
         * @param {Function} params.onerror The callback for the XMLHttpRequest onerror event
         * @returns {Object} The results
         */
        uploadFile: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                services.checkHost(params);

                //validate
                var account = validateAndReturnRequiredAccount(params, reject);
                var realm = validateAndReturnRequiredRealm(params, reject);
                var token = validateAndReturnRequiredAccessToken(params, reject);
                validateRequiredFile(params, reject);

                var url = getRealmResourceURL(services.storageURL, account, realm,
                    'blobs' + (params.id ? '/' + params.id : ''), token, params.ssl);
                var formData = new FormData();
                formData.append('file', params.file);

                b.$.post(url, formData, null, true, null, params.progressCallback, params.onabort, params.onerror).then(function(response){
                    services.auth.updateLastActiveTimestamp();
                    resolve(response.location || response.uri);
                })['catch'](function(error){
                    reject(error);
                });
            });
        },

        /**
         * Retrieves a blob file from the storage service
         *
         * @alias getBlob
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.id The blob id.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {Object} The blob arraybuffer
         */
        getBlob: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                services.checkHost(params);

                //validate
                var account = validateAndReturnRequiredAccount(params, reject);
                var realm = validateAndReturnRequiredRealm(params, reject);
                var token = validateAndReturnRequiredAccessToken(params, reject);
                validateRequiredId(params, reject);

                var url = getRealmResourceURL(services.storageURL, account, realm,
                    'blobs/' + params.id, token, params.ssl);

                b.$.getBlob(url).then(function(response){
                    services.auth.updateLastActiveTimestamp();
                    resolve(response);
                })['catch'](function(error){
                    reject(error);
                });
            });
        },

        /**
         * Deletes a blob file from the storage service
         *
         * @alias deleteBlob
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.id The blob id.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        deleteBlob: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                services.checkHost(params);

                //validate
                var account = validateAndReturnRequiredAccount(params, reject);
                var realm = validateAndReturnRequiredRealm(params, reject);
                var token = validateAndReturnRequiredAccessToken(params, reject);
                validateRequiredId(params, reject);

                var url = getRealmResourceURL(services.storageURL, account, realm,
                    'blobs/' + params.id, token, params.ssl);

                b.$.doDelete(url).then(function(response){
                    services.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function(error){
                    reject(error);
                });
            });
        }
    };
}
