function StorageService(v, utils) {
    function validateRequiredBlob(params, reject){
        utils.validateParameter('blob', 'The blob parameter is required', params, reject);
    }

    function validateRequiredFile(params, reject){
        utils.validateParameter('file', 'The file parameter is required', params, reject);
    }

    var storage = {

        /**
         * Retrieve the storage meta info for the realm
         *
         * @memberOf voyent.storage
         * @alias getMetaInfo
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
         * @param {String} params.scope (default 'self') 'all' or 'self', return meta information for blobs belonging
         *     to all users, or only those belonging to the current user
         * @returns {Object} The results
         */
        getMetaInfo: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.storageURL, account, realm,
                    'meta', token, params.ssl, params.scope ? {scope: params.scope} : null);


                v.$.getJSON(url).then(function(response){
                    v.auth.updateLastActiveTimestamp();
                    resolve(response.directory);
                })['catch'](function(error){
                    reject(error);
                });
            });
        },

        /**
         * Stores a blob
         *
         * @memberOf voyent.storage
         * @alias uploadBlob
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.id The blob id. If not provided, the service will return a new id
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.blob The Blob to store
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Function} params.progressCallback The callback function to call on progress events. eg. function
         *     progressCallback(percentComplete, xhr){..}
         * @returns {Object} The results
         */
        uploadBlob: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                validateRequiredBlob(params, reject);

                var formData = new FormData();
                formData.append('file', params.blob);

                var url = utils.getRealmResourceURL(v.storageURL, account, realm,
                    'blobs' + (params.id ? '/' + params.id : ''), token, params.ssl);

                v.$.post(url, formData, null, true, null, params.progressCallback).then(function(response){
                    v.auth.updateLastActiveTimestamp();
                    resolve(response.location || response.uri);
                })['catch'](function(error){
                    reject(error);
                });
            });
        },

        /**
         * Stores a file
         *
         * @memberOf voyent.storage
         * @alias uploadBlob
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.id The blob id. If not provided, the service will return a new id
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Object} params.file The Blob to store
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Function} params.progressCallback The callback function to call on progress events. eg. function
         *     progressCallback(percentComplete, xhr){..}
         * @param {Function} params.onabort The callback for the XMLHttpRequest onabort event
         * @param {Function} params.onerror The callback for the XMLHttpRequest onerror event
         * @returns {Object} The results
         */
        uploadFile: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                validateRequiredFile(params, reject);

                var url = utils.getRealmResourceURL(v.storageURL, account, realm,
                    'blobs' + (params.id ? '/' + params.id : ''), token, params.ssl);
                var formData = new FormData();
                formData.append('file', params.file);

                v.$.post(url, formData, null, true, null, params.progressCallback, params.onabort, params.onerror).then(function(response){
                    v.auth.updateLastActiveTimestamp();
                    resolve(response.location || response.uri);
                })['catch'](function(error){
                    reject(error);
                });
            });
        },

        /**
         * Retrieves a blob file from the storage service
         *
         * @memberOf voyent.storage
         * @alias getBlob
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.id The blob id.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {Object} The blob arraybuffer
         */
        getBlob: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateRequiredId(params, reject);

                var url = utils.getRealmResourceURL(v.storageURL, account, realm,
                    'blobs/' + params.id, token, params.ssl);

                v.$.getBlob(url).then(function(response){
                    v.auth.updateLastActiveTimestamp();
                    resolve(response);
                })['catch'](function(error){
                    reject(error);
                });
            });
        },

        /**
         * Deletes a blob file from the storage service
         *
         * @memberOf voyent.storage
         * @alias deleteBlob
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.id The blob id.
         * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
         *     voyent.auth.connect() will be used
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        deleteBlob: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateRequiredId(params, reject);

                var url = utils.getRealmResourceURL(v.storageURL, account, realm,
                    'blobs/' + params.id, token, params.ssl);

                v.$.doDelete(url).then(function(response){
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function(error){
                    reject(error);
                });
            });
        },

        getBlobResourcePermissions: function(params){
            params.path = 'blobs';
            return storage.getResourcePermissions(params);
        },

        updateBlobResourcePermissions: function(params){
            params.path = 'blobs';
            return storage.getResourcePermissions(params);
        },

        getResourcePermissions: function(params){
            params.service = 'storage';
            return v.getResourcePermissions(params);
        },

        updateResourcePermissions: function(params){
            params.service = 'storage';
            return v.updateResourcePermissions(params);
        }
    };

    return storage;
}
