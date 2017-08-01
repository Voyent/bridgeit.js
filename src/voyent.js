if (!window.voyent) {
    window.voyent = {};
}

(function (v) {
    var keys = {
        TRANSACTION_KEY: 'voyentTransaction',
        REALM_KEY: 'voyentRealm',
        ADMIN_KEY: 'voyentAdmin',
        USERNAME_KEY: 'voyentUsername',
        ACCOUNT_KEY: 'voyentAccount',
        HOST_KEY: 'voyentHost',
        TOKEN_KEY: 'voyentToken',
        TOKEN_EXPIRES_KEY: 'voyentTokenExpires',
        TOKEN_SET_KEY: 'voyentTokenSet'
    };
    
    var privateUtils = PrivateUtils(v, keys);
    v.$ = PublicUtils(privateUtils);

    //publish some of the private utility functions
    //todo: move the functions into the public-utils.js file if indeed needed
    v.$.getLocalStorageItem = privateUtils.getLocalStorageItem;
    v.$.setLocalStorageItem = privateUtils.setLocalStorageItem;
    v.$.removeLocalStorageItem = privateUtils.removeLocalStorageItem;
    v.$.getSessionStorageItem = privateUtils.getSessionStorageItem;
    v.$.setSessionStorageItem = privateUtils.setSessionStorageItem;
    v.$.removeSessionStorageItem = privateUtils.removeSessionStorageItem;

    v.configureHosts = function (url) {
        if (!url) {
            v.baseURL = privateUtils.isNode ? 'dev.voyent.cloud' : window.location.hostname;
        } else {
            v.baseURL = url;
        }
        //remove any trailing '/'
        if (v.baseURL.substr(v.baseURL.length - 1) === '/') {
            v.baseURL = v.baseURL.slice(0,-1);
        }
        var baseURL = v.baseURL;
        v.authURL = baseURL + '/auth';
        v.authAdminURL = baseURL + '/authadmin';
        v.locateURL = baseURL + '/locate';
        v.docsURL = baseURL + '/docs';
        v.storageURL = baseURL + '/storage';
        v.eventURL = baseURL + '/event';
        v.queryURL = baseURL + '/query';
        v.actionURL = baseURL + '/action';
        v.eventhubURL = baseURL + '/eventhub';
        v.mailboxURL = baseURL + '/mailbox';
        v.deviceURL = baseURL + '/device';
        v.scopeURL = baseURL + '/scope';
        v.pushURL = baseURL + '/notify';
        v.cloudURL = baseURL + '/cloud';
    };

    v.checkHost = function (params) {
        if (params.host) {
            v.configureHosts(params.host);
        }
        else {
            var lastHost = v.auth.getLastKnownHost();
            if (lastHost) {
                v.configureHosts(lastHost);
            }
        }
    };

    /**
     * Start a Voyent transaction.
     *
     * This function will create a new transaction id, and automatially append the id to all voyent network calls.
     * A Voyent transaction is not a ACID transaction, but simply a useful method to aid in auditing and diagnosing
     * distributed network calls, especially among different services.
     *
     * @example
     *    voyent.startTransaction();
     *   console.log('started transaction: ' +  voyent.getLastTransactionId());
     *
     *    voyent.auth.login({
     *       account: accountId,
     *       username: adminId,
     *       password: adminPassword,
     *       host: host
     *   }).then(function (authResponse) {
     *       return  voyent.docs.createDocument({
     *           document: newDoc,
     *           realm: realmId
     *       });
     *   }).then(function (docURI) {
     *       newDocURI = docURI;
     *       var uriParts = docURI.split('/');
     *       var docId = uriParts[uriParts.length - 1];
     *       return  voyent.docs.deleteDocument({
     *           account: accountId,
     *           realm: realmId,
     *           host: host,
     *           id: docId
     *       })
     *   }).then(function () {
     *       console.log('completed transaction: ' +  voyent.getLastTransactionId());
     *        voyent.endTransaction();
     *   }).catch(function (error) {
     *       console.log('something went wrong with transaction: ' +  voyent.getLastTransactionId());
     *        voyent.endTransaction();
     *   });
     */
    v.startTransaction = function () {
        privateUtils.setSessionStorageItem(btoa(keys.TRANSACTION_KEY), v.$.newUUID());
        console.log('bridgeit: started transaction ' + v.getLastTransactionId());
    };

    /**
     * End a Voyent transaction.
     *
     * This function will remove the current Voyent transaction id, if one exists.
     */
    v.endTransaction = function () {
        privateUtils.removeSessionStorageItem(btoa(keys.TRANSACTION_KEY));
        console.log('bridgeit: ended transaction ' + v.getLastTransactionId());
    };

    /**
     * Get last transaction.
     *
     * Return the last stored Voyent transaction id.
     */
    v.getLastTransactionId = function () {
        return privateUtils.getSessionStorageItem(btoa(keys.TRANSACTION_KEY));
    };

    /**
     * Sets the current realm for all subsequent operations. This is useful when logging in as an admin, who is not
     * in any realm, but needing to ensure that all other operations are done with a particular realm.
     *
     * @example
     *     voyent.auth.login({
     *      account: accountId,
     *    	username: adminId,
     *    	password: adminPassword,
     *    	host: host
     *    }).then(function(authResponse){
     *    	 voyent.setCurrentRealm('myRealm');
     *    	//realm is no longer required for all subsequent operations
     *    	return  voyent.docs.createDocument({
     *    		document: newDoc
     *    	});
     *    }).then(function(docURI){
     *    	newDocURI = docURI;
     *    	var uriParts = docURI.split('/');
     *    	var docId = uriParts[uriParts.length-1];
     *    	return  voyent.docs.deleteDocument({
     *    		account: accountId,
     *    		host: host,
     *    		id: docId
     *    	})
     *    });
     *
     *
     * @alias setCurrentRealm
     * @global
     * @param {String} realm The name of thre realm to use for future operations.
     */
    v.setCurrentRealm = function(realm){
        privateUtils.setSessionStorageItem(btoa(keys.REALM_KEY), btoa(realm));
    };

    /**
     * Return the permissions block for a resource. A permissions block has the following structure:
     *
     * @example
     *    {
     *        "_id": "de6959d0-a885-425c-847a-3289d07321ae",
     *        "owner": "jo.smith",
     *        "rights": {
     *            "owner": ["r","u","d","x","pr","pu"],
     *            "realm": ["r","x"],
     *            "roles": {
     *                "demoAdmin": ["r","u","d","x","pu"]
     *            }
     *        }
     *    }
     *
     *
     * The permissions codes:
     *
     *     r: Read
     *     u: Update
     *     d: Delete
     *     x: Execute
     *    pr: Permissions Read
     *    pu: Permissions Update
     *    mu: Client Metadata Update
     *
     *
     * @example
     *     voyent.getResourcePermissions({
     *    	account: accountId,
     *    	username: adminId,
     *    	password: adminPassword,
     *    	host: host,
     *    	service: 'docs',
     *    	path: 'documents',
     *    	id: 'resourceId'
     *    }).then(function(permissions){
     *    	console.log('permissions', permissions);
     *    });
     *
     * @alias getResourcePermissions
     * @global
     *
     * @param {Object} params params
     * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
     *     will be used.
     * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
     *     will be used.
     * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
     *      voyent.auth.connect() will be used
     * @param {String} params.id The id of the resource to get permissions for.
     * @param {String} params.service The service that manages the resource.
     * @param {String} params.path The path to the resource.
     * @returns {Object} The permissions block for the resource.
     */
    v.getResourcePermissions = function(params){
        return new Promise(
            function(resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                //validate
                var account = privateUtils.validateAndReturnRequiredAccount(params, reject);
                var realm = privateUtils.validateAndReturnRequiredRealm(params, reject);
                var token = privateUtils.validateAndReturnRequiredAccessToken(params, reject);
                privateUtils.validateRequiredId(params, reject);
                privateUtils.validateParameter('service', 'The service parameter is required', params, reject);
                privateUtils.validateParameter('path', 'The path parameter is required', params, reject);

                var serviceURL;
                switch(params.service){
                    case 'docs': serviceURL = v.docsURL; break;
                    case 'action': serviceURL = v.actionURL; break;
                    case 'eventhub': serviceURL = v.eventhubURL; break;
                    case 'query': serviceURL = v.queryURL; break;
                    case 'storage': serviceURL = v.storageURL; break;
                    case 'mailbox': serviceURL = v.mailboxURL; break;
                    case 'locate': serviceURL = v.locateURL; break;
                }

                var url = privateUtils.getRealmResourceURL(serviceURL, account, realm, params.path + '/' + params.id + '/permissions', token, params.ssl);

                v.$.getJSON(url).then(function(json){
                    v.auth.updateLastActiveTimestamp();
                    var permissionsBlock;
                    if( json.directory && json.directory.length > 0 ){
                        permissionsBlock = json.directory[0];
                    }
                    else{
                        permissionsBlock = json;
                    }
                    resolve(permissionsBlock);
                })['catch'](function(error){
                    reject(error);
                });
            }
        );
    };

    /**
     * Modify the permissions block for a resource. See {@link getResourcePermissions} for additional details.
     *
     * @example
     *    var permissionsBlock == {
     *        "_id": "de6959d0-a885-425c-847a-3289d07321ae",
     *        "owner": "jo.smith",
     *        "rights": {
     *            "owner": ["r","u","d","x","pr","pu"],
     *            "realm": ["r","x"],
     *            "roles": {
     *                "demoAdmin": ["r","u","d","x","pu"]
     *            }
     *        }
     *    };
     *
     * @example
     *     voyent.updateResourcePermissions({
     *    	account: accountId,
     *    	username: adminId,
     *    	password: adminPassword,
     *    	host: host,
     *    	service: 'docs',
     *    	path: 'documents',
     *    	id: 'resourceId',
     *    	permissions: permissionsBlock
     *    }).then(function(permissions){
     *    	console.log('permissions', permissions);
     *    });
     *
     *
     * @alias updateResourcePermissions
     * @global
     *
     * @param {Object} params params
     * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
     *     will be used.
     * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
     *     will be used.
     * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
     *      voyent.auth.connect() will be used
     * @param {String} params.id The id of the resource to get permissions for.
     * @param {String} params.service The service that manages the resource.
     * @param {String} params.path The path to the resource.
     * @returns {Object} The permissions block for the resource.
     */
    v.updateResourcePermissions = function(params){
        return new Promise(
            function(resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                //validate
                var account = privateUtils.validateAndReturnRequiredAccount(params, reject);
                var realm = privateUtils.validateAndReturnRequiredRealm(params, reject);
                var token = privateUtils.validateAndReturnRequiredAccessToken(params, reject);
                privateUtils.validateRequiredId(params, reject);
                privateUtils.validateParameter('permissions', 'The permissions parameter is required', params, reject);
                privateUtils.validateParameter('service', 'The service parameter is required', params, reject);
                privateUtils.validateParameter('path', 'The path parameter is required', params, reject);

                var serviceURL;
                switch(params.service){
                    case 'docs': serviceURL = v.io.docsURL; break;
                    case 'action': serviceURL = v.io.actionURL; break;
                }

                var url = privateUtils.getRealmResourceURL(serviceURL, account, realm, params.path + '/' + params.id + '/permissions', token, params.ssl);

                v.$.put(url, params.permissions).then(function(json){
                    v.auth.updateLastActiveTimestamp();
                    resolve(json);
                })['catch'](function(error){
                    reject(error);
                });
            }
        );
    };

    v.action = ActionService(v, privateUtils);
    v.admin = AdminService(v, keys, privateUtils);
    v.auth = AuthService(v, keys, privateUtils);
    v.docs = DocService(v, privateUtils);
    v.eventhub = EventHubService(v, privateUtils);
    v.locate = LocateService(v, privateUtils);
    v.mailbox = MailboxService(v, privateUtils);
    v.scope = ScopeService(v, privateUtils);
    v.metrics = MetricsService(v, privateUtils);
    v.event = EventService(v, privateUtils);
    v.push = PushService(v, privateUtils);
    v.cloud = CloudService(v, privateUtils);
    v.storage = StorageService(v, privateUtils);
    v.query = QueryService(v, privateUtils);
    v.device = DeviceService(v, privateUtils);

    //aliases for backward compatibility
    v.documents = v.docs;
    v.location = v.locate;

    /* Initialization */
    v.configureHosts();

    /* check connect settings */
    if (v.auth.isLoggedIn()) {
        var connectSettings = v.auth.getConnectSettings();
        if (connectSettings) {
            //user is logged in and has connect settings, so reconnect
            v.auth.connect(connectSettings);
        }
    }
})(voyent);
