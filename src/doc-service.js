function DocService(v, utils) {
    function validateCollection(params, reject){
        return params.collection ? params.collection : 'documents';
    }

    return {

        /**
         * Create a new document
         *
         * @alias createDocument
         * @param {Object} params params
         * @param {String} params.collection The name of the document collection.  Defaults to 'documents'.
         * @param {String} params.id The document id. If not provided, the service will return a new id
         * @param {Object} params.document The document to be created
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {String} The resource URI
         */
        createDocument: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var collection = validateCollection(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.documentsURL, account, realm,
                        collection + '/' + (params.id ? params.id : ''), token, params.ssl);

                    v.$.post(url, params.document).then(function(response){
                        v.auth.updateLastActiveTimestamp();
                        resolve(response.uri);
                    })['catch'](function(error){
                        reject(error);
                    });

                }
            );
        },

        /**
         * Update a document
         *
         * @alias updateDocument
         * @param {Object} params params
         * @param {String} params.collection The name of the document collection.  Defaults to 'documents'.
         * @param {String} params.id The document id.
         * @param {Object} params.document The document to be created
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {String} The resource URI
         */
        updateDocument: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var collection = validateCollection(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.documentsURL, account, realm,
                        collection + '/' + params.id, token, params.ssl);

                    v.$.put(url, params.document).then(function(){
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Fetch a document
         *
         * @alias getDocument
         * @param {Object} params params
         * @param {String} params.collection The name of the document collection.  Defaults to 'documents'.
         * @param {String} params.id The document id. If not provided, the service will return a new id
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {Object} The document
         */
        getDocument: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var collection = validateCollection(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.documentsURL, account, realm,
                        collection + '/' + params.id, token, params.ssl);

                    v.$.getJSON(url).then(function(doc){
                        v.auth.updateLastActiveTimestamp();
                        //the document service always returns a list, so
                        //check if we have a list of one, and if so, return the single item
                        if( doc.length && doc.length === 1 ){
                            resolve(doc[0]);
                        }
                        else{
                            resolve(doc);
                        }
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Searches for documents in a realm based on a query
         *
         * @alias findDocuments
         * @param {Object} params params
         * @param {String} params.collection The name of the document collection.  Defaults to 'documents'.
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Object} params.query A mongo query for the documents
         * @param {Object} params.fields Specify the inclusion or exclusion of fields to return in the result set
         * @param {Object} params.options Additional query options such as limit and sort
         * @returns {Object} The results
         */
        findDocuments: function(params){
            return new Promise(
                function(resolve, reject) {

                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var collection = validateCollection(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.documentsURL, account, realm,
                        collection, token, params.ssl, {
                            'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                            'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                            'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                        });

                    v.$.getJSON(url).then(function(doc){
                        v.auth.updateLastActiveTimestamp();
                        resolve(doc);
                    })['catch'](function(response){
                        //service currently returns a 404 when no documents are found
                        if( response.status == 404 ){
                            resolve(null);
                        }
                        else{
                            reject(response);
                        }
                    });

                }
            );
        },

        /**
         * Delete a new document
         *
         * @alias deleteDocument
         * @param {Object} params params
         * @param {String} params.collection The name of the document collection.  Defaults to 'documents'.
         * @param {String} params.id The document id. If not provided, the service will return a new id
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         */
        deleteDocument: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var collection = validateCollection(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    utils.validateRequiredId(params, reject);

                    var url = utils.getRealmResourceURL(v.documentsURL, account, realm,
                        collection + '/' + params.id, token, params.ssl);

                    v.$.doDelete(url).then(function(response){
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        }

    };
}