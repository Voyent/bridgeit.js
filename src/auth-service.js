function AuthService(b, utils) {
    function validateRequiredRealm(params, reject){
        utils.validateParameter('realm', 'The BridgeIt realm is required', params, reject);
    }

    function validateRequiredPassword(params, reject){
        utils.validateParameter('password', 'The password parameter is required', params, reject);
    }

    function validateRequiredPermissions(params, reject){
        utils.validateParameter('permissions', 'The permissions parameter is required', params, reject);
    }

    function fireEvent(el, eventName, detail){
        var event;
        if( 'CustomEvent' in window ){
            event = new CustomEvent(eventName, { 'detail': detail });
        }
        else if(document.createEvent){//IE 10 & other older browsers
            event = document.createEvent('HTMLEvents');
            event.initEvent(eventName, true, true);
        }
        else if(document.createEventObject){// IE < 9
            event = document.createEventObject();
            event.eventType = eventName;
        }
        event.eventName = eventName;
        if(el.dispatchEvent){
            el.dispatchEvent(event);
        }else if(el.fireEvent && htmlEvents['on'+eventName]){// IE < 9
            el.fireEvent('on'+event.eventType, event);// can trigger only real event (e.g. 'click')
        }else if(el[eventName]){
            el[eventName]();
        }else if(el['on'+eventName]){
            el['on'+eventName]();
        }
    }

    var REALM_KEY = 'bridgeitRealm';
    var ACCOUNT_KEY = 'bridgeitAccount';
    var USERNAME_KEY = 'bridgeitUsername';
    var PASSWORD_KEY = 'bridgeitPassword';
    var USER_STORE_KEY = "bridgeitUserStore";
    var USER_STORE_SETTING_KEY = "bridgeitUserStoreSetting";
    var CONNECT_SETTINGS_KEY = 'bridgeitConnectSettings';
    var RELOGIN_CB_KEY = 'bridgeitReloginCallback';
    var LAST_ACTIVE_TS_KEY = 'bridgeitLastActiveTimestamp';
    var TOKEN_KEY = 'bridgeitToken';
    var TOKEN_EXPIRES_KEY = 'bridgeitTokenExpires';
    var TOKEN_SET_KEY = 'bridgeitTokenSet';
    var LAST_UPDATED = "last_updated";

    var services = b.io;

    return {

        /**
         * Retrieve a new access token from the BridgeIt auth service.
         *
         * The function returns a Promise that, when successful, returns an object with the following structure:
         *    {
		 *       "access_token": "d9f7463d-d100-42b6-aecd-ae21e38e5d02",
		 *       "expires_in": 1420574793844
		 *    }
         *
         * Which contains the access token and the time, in milliseconds that the session will expire in.
         *
         * Unlike the login, and connect functions, this function does not store the access token after it
         * is retrieved.
         *
         * @alias getNewAccessToken
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name (required)
         * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
         * @param {String} params.username User name (required)
         * @param {String} params.password User password (required)
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns Promise with the following argument:
         *      {
		 *          access_token: 'xxx',
		 *          expires_in: 99999
		 *      }
         *
         */
        getNewAccessToken: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    if( !params.realm ){
                        params.realm = 'admin';
                    }

                    //validation
                    if( !params.account ){
                        reject(Error('BridgeIt account required for new access token'));
                        return;
                    }
                    if( !params.password ){
                        reject(Error('password required for new access token'));
                        return;
                    }
                    if( !params.username ){
                        reject(Error('username required for new access token'));
                        return;
                    }
                    var protocol = params.ssl ? 'https://' : 'http://';
                    var url = protocol + services.authURL + '/' + encodeURI(params.account) +
                        '/realms/' + encodeURI(params.realm) + '/token/?' + getTransactionURLParam();

                    b.$.post(url, {
                        strategy: 'query',
                        username: params.username,
                        password: params.password
                    }).then(function(authResponse){
                        resolve(authResponse);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Login into bridgeit services.
         *
         * This function will login into the BridgeIt auth service and return a user token and expiry timestamp upon
         * successful authentication. This function does not need to be called if bridgeit.connect has already been
         * called, as that function will automatically extend the user session, unless the timeout has passed.
         *
         * The function returns a Promise that, when successful, returns an object with the following structure:
         *    {
		 *       "access_token": "d9f7463d-d100-42b6-aecd-ae21e38e5d02",
		 *       "expires_in": 1420574793844
		 *    }
         *
         * Which contains the access token and the time, in milliseconds that the session will expire in.
         *
         * @alias login
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name (required)
         * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
         * @param {String} params.username User name (required)
         * @param {String} params.password User password (required)
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns Promise with the following argument:
         *      {
		 *          access_token: 'xxx',
		 *          expires_in: 99999
		 *      }
         *
         */
        login: function(params) {
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    if( !params.realm ){
                        params.realm = 'admin';
                    }

                    //validation
                    if( !params.account ){
                        reject(Error('BridgeIt account required for login'));
                        return;
                    }
                    if( !params.password ){
                        reject(Error('password required for login'));
                        return;
                    }
                    if( !params.username ){
                        reject(Error('username required for login'));
                        return;
                    }
                    var protocol = params.ssl ? 'https://' : 'http://';
                    var txParam = getTransactionURLParam();
                    var url = protocol + services.authURL + '/' + encodeURI(params.account) +
                        '/realms/' + encodeURI(params.realm) + '/token/' + ( txParam ? ('?' + txParam) : '');

                    var loggedInAt = new Date().getTime();
                    b.$.post(url, {
                        strategy: 'query',
                        username: params.username,
                        password: params.password
                    }).then(function(authResponse){
                        if( !params.suppressUpdateTimestamp ){
                            services.auth.updateLastActiveTimestamp();
                        }
                        utils.setSessionStorageItem(btoa(TOKEN_KEY), authResponse.access_token);
                        utils.setSessionStorageItem(btoa(TOKEN_EXPIRES_KEY), authResponse.expires_in);
                        utils.setSessionStorageItem(btoa(TOKEN_SET_KEY), loggedInAt);
                        utils.setSessionStorageItem(btoa(ACCOUNT_KEY), btoa(params.account));
                        utils.setSessionStorageItem(btoa(REALM_KEY), btoa(params.realm));
                        utils.setSessionStorageItem(btoa(USERNAME_KEY), btoa(params.username));

                        resolve(authResponse);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Connect to bridgeit services.
         *
         * This function will connect to the BridgeIt services, and maintain the connection for the specified
         * timeout period (default 20 minutes). By default, the BridgeIt push service is also activated, so the client
         * may send and receive push notifications after connecting.
         *
         * After connecting to BridgeIt Services, any BridgeIt service API may be used without needing to re-authenticate.
         * After successfully connection an authentication will be stored in session storage and available through
         * sessionStorage.bridgeitToken. This authentication information will automatically be used by other BridgeIt API
         * calls, so the token does not be included in subsequent calls, but is available if desired.
         *
         * A simple example of connecting to the BridgeIt Services and then making a service call is the following:
         *
         * bridgeit.connect({
		 *           account: 'my_account',
		 *           realm: 'realmA',
		 *           user: 'user',
		 *           password: 'secret'})
         *   .then( function(){
		 *      console.log("successfully connnected to BridgeIt Services");
		 *      //now we can fetch some docs
		 *      return bridgeit.docService.get('documents');
		 *   })
         *   .then( function(docs){
		 *      for( var d in docs ){ ... };
		 *   })
         *   .catch( function(error){
		 *      console.log("error connecting to BridgeIt Services: " + error);
		 *   });
         *
         * @alias connect
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name
         * @param {String} params.realm BridgeIt Services realm
         * @param {String} params.username User name
         * @param {String} params.password User password
         * @param {String} params.host The BridgeIt Services host url, defaults to api.bridgeit.io
         * @param {Boolean} params.usePushService Open and connect to the BridgeIt push service, default true
         * @param {Boolean} params.connectionTimeout The timeout duration, in minutes, that the BridgeIt login will last during inactivity. Default 20 minutes.
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Boolean} params.storeCredentials (default true) Whether to store encrypted credentials in session storage. If set to false, bridgeit will not attempt to relogin before the session expires.
         * @param {Function} params.onSessionExpiry Function callback to be called on session expiry. If you wish to ensure that disconnect is not called until after your onSessionExpiry callback has completed, please return a Promise from your function.
         * @returns Promise with service definitions
         *
         */
        connect: function(params){
            return new Promise(function(resolve, reject) {

                function initConnectCallback(){

                    function connectCallback(){
                        console.log(new Date().toISOString() + ' bridgeit connect: callback running')
                        var connectSettings = services.auth.getConnectSettings();
                        if( !connectSettings ){
                            console.log(new Date().toISOString() + ' bridgeit connect: error, could not retrieve settings');
                            return;
                        }

                        var timeoutMillis = connectSettings.connectionTimeout * 60 * 1000;

                        //first check if connectionTimeout has expired
                        var now = new Date().getTime();
                        console.log('bridgeit.getLastActiveTimestamp: ' + services.auth.getLastActiveTimestamp());
                        console.log('bridgeit timeout ms: ' + timeoutMillis);
                        console.log('bridgeit now ms: ' + now);
                        if( ( now - services.auth.getLastActiveTimestamp()) < timeoutMillis ){
                            console.log(new Date().toISOString() + ' bridgeit connect: timeout has not been exceeded, ' + services.auth.getTimeRemainingBeforeExpiry()/1000/60 + ' mins remaining');

                            if( (connectSettings.connectionTimeout * 1000 * 60 ) > services.auth.getTimeRemainingBeforeExpiry()){

                                var loginParams = services.auth.getConnectSettings();
                                loginParams.account = atob(utils.getSessionStorageItem(btoa(ACCOUNT_KEY)));
                                loginParams.realm = atob(utils.getSessionStorageItem(btoa(REALM_KEY)));
                                loginParams.username = atob(utils.getSessionStorageItem(btoa(USERNAME_KEY)));
                                loginParams.password = atob(utils.getSessionStorageItem(btoa(PASSWORD_KEY)));
                                loginParams.suppressUpdateTimestamp = true;

                                services.auth.login(loginParams).then(function(authResponse){
                                    fireEvent(window, 'bridgeit-access-token-refreshed', services.auth.getLastAccessToken());
                                    if( loginParams.usePushService ){
                                        services.push.startPushService(loginParams);
                                    }
                                    setTimeout(connectCallback, services.auth.getTimeRemainingBeforeExpiry() - timeoutPadding);
                                })['catch'](function(response){
                                    var msg = new Date().toISOString() + ' bridgeit connect: error relogging in: ' + response.responseText;
                                    console.error(msg);
                                    reject(response);
                                    throw new Error(msg);
                                });
                            }
                            else{
                                console.log( new Date().toISOString() + ' bridgeit connect: setting callback for ' + connectSettings.connectionTimeout + ' minutes');
                                setTimeout(connectCallback, connectSettings.connectionTimeout * 60 * 1000);
                            }
                        }
                        else{
                            console.log( new Date().toISOString() + ' bridgeit connect: timeout has expired, disconnecting..');


                            //look for the onSessionExpiry callback on the params first,
                            //as functions could be passed by reference
                            //secondly by settings, which would only be passed by name
                            var expiredCallback = params.onSessionExpiry;
                            if( !expiredCallback ){
                                expiredCallback = connectSettings.onSessionExpiry;
                            }

                            //if there's no onSessionExpiry, call disconnect immediately
                            //otherwise search for onSessionExpiry function, if not found
                            //call disconnect() immediately, otherwise call onSessionExpiry
                            //if callback if a promise, wait until the promise completes
                            //before disconnecting, otherwise, wait 500ms then disconnect
                            if( expiredCallback ){
                                var expiredCallbackFunction;
                                if( typeof expiredCallback === 'function'){
                                    expiredCallbackFunction = expiredCallback;
                                }
                                else if( typeof expiredCallback === 'string'){
                                    expiredCallbackFunction = utils.findFunctionInGlobalScope(expiredCallback);
                                }
                                if( expiredCallbackFunction ){
                                    var expiredCallbackPromise = expiredCallbackFunction();
                                    if( expiredCallbackPromise && expiredCallbackPromise.then ){
                                        expiredCallbackPromise.then(services.auth.disconnect)
                                            ['catch'](services.auth.disconnect);
                                    }
                                    else{
                                        setTimeout(services.auth.disconnect, 500);
                                    }
                                }
                                else{
                                    console.log( new Date().toISOString() + ' bridgeit connect: error calling onSessionExpiry callback, ' +
                                        'could not find function: ' + expiredCallback);
                                    services.auth.disconnect();
                                }

                            }
                            else{
                                services.auth.disconnect();
                            }

                        }
                    }

                    var callbackTimeout;

                    //if the desired connection timeout is greater the token expiry
                    //set the callback check for just before the token expires
                    if( connectionTimeoutMillis > services.auth.getExpiresIn()){
                        callbackTimeout = services.auth.getTimeRemainingBeforeExpiry() - timeoutPadding;
                    }
                    //otherwise the disired timeout is less then the token expiry
                    //so set the callback to happen just at specified timeout
                    else{
                        callbackTimeout = connectionTimeoutMillis;
                    }

                    console.log( new Date().toISOString() + ' bridgeit connect: setting timeout to ' + callbackTimeout / 1000 / 60 + ' mins, expiresIn: ' + services.auth.getExpiresIn() + ', remaining: '  + services.auth.getTimeRemainingBeforeExpiry());
                    var cbId = setTimeout(connectCallback, callbackTimeout);
                    utils.setSessionStorageItem(btoa(RELOGIN_CB_KEY), cbId);
                }

                var timeoutPadding = 500;
                params = params ? params : {};
                services.checkHost(params);
                if( !params.storeCredentials){
                    params.storeCredentials = true;
                }

                //store connect settings
                var settings = {
                    host: services.baseURL,
                    usePushService: params.usePushService,
                    connectionTimeout: params.connectionTimeout || 20,
                    ssl: params.ssl,
                    storeCredentials: params.storeCredentials || true,
                    onSessionExpiry: params.onSessionExpiry
                };
                utils.setSessionStorageItem(btoa(CONNECT_SETTINGS_KEY), btoa(JSON.stringify(settings)));

                if( params.onSessionExpiry ){
                    if( typeof params.onSessionExpiry === 'function'){
                        var name = utils.getFunctionName(params.onSessionExpiry);
                        if( name ){
                            settings.onSessionExpiry = name;
                        }
                    }
                }

                var connectionTimeoutMillis =  settings.connectionTimeout * 60 * 1000;

                if( services.auth.isLoggedIn()){
                    initConnectCallback();
                    if( settings.usePushService ){
                        services.push.startPushService(settings);
                    }
                    resolve();
                }
                else{
                    services.auth.login(params).then(function(authResponse){
                        console.log('bridgeit.io.auth.connect: ' + new Date().toISOString() + ' received auth response');
                        utils.setSessionStorageItem(btoa(ACCOUNT_KEY), btoa(bridgeit.io.auth.getLastKnownAccount()));
                        utils.setSessionStorageItem(btoa(REALM_KEY), btoa(bridgeit.io.auth.getLastKnownRealm()));
                        utils.setSessionStorageItem(btoa(USERNAME_KEY), btoa(params.username));
                        utils.setSessionStorageItem(btoa(PASSWORD_KEY), btoa(params.password));
                        initConnectCallback();
                        if( settings.usePushService ){
                            services.push.startPushService(settings);
                        }
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            });
        },

        refreshAccessToken: function(){
            return new Promise(function(resolve, reject) {
                if( !services.auth.isLoggedIn()){
                    reject('bridgeit.io.auth.refreshAccessToken() not logged in, cant refresh token');
                }
                else{
                    var loginParams = services.auth.getConnectSettings();
                    if( !loginParams ){
                        reject('bridgeit.io.auth.refreshAccessToken() no connect settings, cant refresh token');
                    }
                    else{
                        loginParams.account = atob(utils.getSessionStorageItem(btoa(ACCOUNT_KEY)));
                        loginParams.realm = atob(utils.getSessionStorageItem(btoa(REALM_KEY)));
                        loginParams.username = atob(utils.getSessionStorageItem(btoa(USERNAME_KEY)));
                        loginParams.password = atob(utils.getSessionStorageItem(btoa(PASSWORD_KEY)));
                        loginParams.suppressUpdateTimestamp = true;

                        services.auth.login(loginParams).then(function(authResponse){
                            fireEvent(window, 'bridgeit-access-token-refreshed', services.auth.getLastAccessToken());
                            if( loginParams.usePushService ){
                                services.push.startPushService(loginParams);
                            }
                            resolve(authResponse);
                        })['catch'](function(response){
                            reject(response);
                        });
                    }
                }

            });
        },

        /**
         * Disconnect from BridgeIt Services.
         *
         * This function will logout from BridgeIt Services and remove all session information from the client.
         *
         * TODO
         *
         * @alias disconnect
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.username User name (required)
         * @param {String} params.password User password (required)
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns Promise with the following argument:
         *      {
		 *          access_token: 'xxx',
		 *          expires_in: 99999
		 *      }
         *
         */
        disconnect: function(){
            utils.removeSessionStorageItem(btoa(TOKEN_KEY));
            utils.removeSessionStorageItem(btoa(TOKEN_EXPIRES_KEY));
            utils.removeSessionStorageItem(btoa(CONNECT_SETTINGS_KEY));
            utils.removeSessionStorageItem(btoa(TOKEN_SET_KEY));
            utils.removeSessionStorageItem(btoa(ACCOUNT_KEY));
            utils.removeSessionStorageItem(btoa(REALM_KEY));
            utils.removeSessionStorageItem(btoa(USERNAME_KEY));
            utils.removeSessionStorageItem(btoa(PASSWORD_KEY));
            utils.removeSessionStorageItem(btoa(LAST_ACTIVE_TS_KEY));
            var cbId = utils.getSessionStorageItem(btoa(RELOGIN_CB_KEY));
            if( cbId ){
                clearTimeout(cbId);
            }
            utils.removeSessionStorageItem(btoa(RELOGIN_CB_KEY));
            console.log(new Date().toISOString() + ' bridgeit has disconnected')
        },

        getLastAccessToken: function(){
            return utils.getSessionStorageItem(btoa(TOKEN_KEY));
        },

        getExpiresIn: function(){
            var expiresInStr = utils.getSessionStorageItem(btoa(TOKEN_EXPIRES_KEY));
            if( expiresInStr ){
                return parseInt(expiresInStr,10);
            }
        },

        getTokenSetAtTime: function(){
            var tokenSetAtStr = utils.getSessionStorageItem(btoa(TOKEN_SET_KEY));
            if( tokenSetAtStr ){
                return parseInt(tokenSetAtStr,10);
            }
        },

        getTimeRemainingBeforeExpiry: function(){
            var expiresIn = services.auth.getExpiresIn();
            var token = services.auth.getExpiresIn();
            if( expiresIn && token ){
                var now = new Date().getTime();
                return (services.auth.getTokenSetAtTime() + expiresIn) - now;
            }
        },

        getConnectSettings: function(){
            var settingsStr = utils.getSessionStorageItem(btoa(CONNECT_SETTINGS_KEY));
            if( settingsStr ){
                return JSON.parse(atob(settingsStr));
            }
        },

        isLoggedIn: function(){
            var token = utils.getSessionStorageItem(btoa(TOKEN_KEY)),
                tokenExpiresInStr = utils.getSessionStorageItem(btoa(TOKEN_EXPIRES_KEY)),
                tokenExpiresIn = tokenExpiresInStr ? parseInt(tokenExpiresInStr,10) : null,
                tokenSetAtStr = utils.getSessionStorageItem(btoa(TOKEN_SET_KEY)),
                tokenSetAt = tokenSetAtStr ? parseInt(tokenSetAtStr,10) : null,
                result = token && tokenExpiresIn && tokenSetAt && (new Date().getTime() < (tokenExpiresIn + tokenSetAt) );
            return !!result;
        },

        getLastKnownAccount: function(){
            var accountCipher = utils.getSessionStorageItem(btoa(ACCOUNT_KEY));
            if( accountCipher ){
                return atob(accountCipher);
            }
        },

        getLastKnownRealm: function(){
            var realmCipher = utils.getSessionStorageItem(btoa(REALM_KEY));
            if( realmCipher ){
                return atob(realmCipher);
            }
        },

        getLastKnownUsername: function () {
            var usernameCipher = utils.getSessionStorageItem(btoa(USERNAME_KEY));
            if (usernameCipher) {
                return atob(usernameCipher);
            }
        },


        /**
         * Register a new user for a realm that supports open user registrations.
         *
         * @alias registerAsNewUser
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.username User name (required)
         * @param {String} params.password User password (required)
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {String} params.firstname The user's first name (optional)
         * @param {String} params.lastname The user's last name (optional)
         * @param {String} params.email The user's email (optional)
         * @param {Object} params.custom Custom user information
         * @returns Promise
         */
        registerAsNewUser: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    utils.validateRequiredUsername(params, reject);
                    validateRequiredPassword(params, reject);

                    var user = {
                        username: params.username,
                        password: params.password
                    };

                    if( 'firstname' in params ){
                        user.firstname = params.firstname;
                    }
                    if( 'lastname' in params ){
                        user.lastname = params.lastname;
                    }
                    if( 'email' in params ){
                        user.email = params.email;
                    }
                    if( 'custom' in params ){
                        user.custom = params.custom;
                    }

                    var url = utils.getRealmResourceURL(services.authAdminURL, account, realm,
                        'quickuser', services.auth.getLastAccessToken(), params.ssl);

                    b.$.post(url, {user: user}).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /**
         * Check if the current user has a set of permissions.
         *
         * @alias checkUserPermissions
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {String} params.permissions A space-delimited list of permissions
         * @returns Promise
         */
        checkUserPermissions: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    validateRequiredPermissions(params, reject);

                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(services.authURL, account, realm,
                        'permission', token, params.ssl);

                    b.$.post(url, {permissions: params.permissions}).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve(true);
                    })['catch'](function(response){
                        if( response.status == 403){
                            services.auth.updateLastActiveTimestamp();
                            resolve(false);
                        }
                        else{
                            reject(error);
                        }
                    });
                }
            );
        },

        /**
         * Check if the current user has a set of roles.
         *
         * @alias checkUserRoles
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {String} params.roles A space-delimited list of permissions
         * @param {String} params.op 'and' (default) or 'or' or 'single'
         * @returns Promise

         checkUserRoles: function(params){
			return new Promise(
				function(resolve, reject) {
					params = params ? params : {};
					services.checkHost(params);

					validateRequiredPermissions(params, reject);

					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);

					 /authadmin/:accountname/realms/:realmname/roles/:username/rolecheck

					var url = getRealmResourceURL(services.authAdminURL, account, realm,
						'roles/' + , token, params.ssl);

					b.$.post(url, {permissions: params.permissions}).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(true);
					})['catch'](function(response){
						if( response.status == 403){
							services.auth.updateLastActiveTimestamp();
							resolve(false);
						}
						else{
							reject(error);
						}
					});
				}
			);
		},
         */

        /**
         * Update the last active timestamp for BridgeIt auth. This value is used
         * when checking for clients-side session timeouts.
         * @alias updateLastActiveTimestamp
         */
        updateLastActiveTimestamp: function(){
            utils.setSessionStorageItem(btoa(LAST_ACTIVE_TS_KEY), new Date().getTime());
        },

        /**
         * Return the timestamp of the last bridgeit op or when bridgeit.io.auth.updateLastActiveTimestamp()
         * was called.
         * @alias getLastActiveTimestamp
         */
        getLastActiveTimestamp: function(){
            return utils.getSessionStorageItem(btoa(LAST_ACTIVE_TS_KEY));
        },

        /**
         * User the browser local storage to cache the user store. This will allow access to the user store
         * when the user is offline or when the server is not accessible.
         *
         * @alias enableUserStoreCache
         *
         */
        enableUserStoreCache: function(){
            if( !services.auth.isLoggedIn() ){
                console.log('not logged in, cannot access user store');
                return;
            }
            var userStoreSettings;
            var username = services.auth.getLastKnownUsername();
            if( !username ){
                console.log('username not available, cannot access user store');
                return;
            }
            var userStoreSettingsStr = utils.getLocalStorageItem(btoa(USER_STORE_SETTING_KEY));
            if( !userStoreSettingsStr ){
                userStoreSettings = {};
            }
            else{
                userStoreSettings = JSON.parse(atob(userStoreSettingsStr));
            }
            userStoreSettings[username] = new Date().getTime();
            utils.setLocalStorageItem(btoa(USER_STORE_SETTING_KEY), btoa(JSON.stringify(userStoreSettings)));

        },

        /**
         * Disaled the browser local storage to cache the user store.
         *
         * @alias disableUserStoreCache
         *
         */
        disableUserStoreCache: function(){
            if( !services.auth.isLoggedIn() ){
                console.log('not logged in, cannot access user store');
                return;
            }
            var userStoreSettings;
            var username = services.auth.getLastKnownUsername();
            if( !username ){
                console.log('username not available, cannot access user store');
                return;
            }
            var userStoreSettingsStr = utils.getLocalStorageItem(btoa(USER_STORE_SETTING_KEY));
            if( !userStoreSettingsStr ){
                userStoreSettings = {};
            }
            else{
                userStoreSettings = JSON.parse(atob(userStoreSettingsStr));
            }
            userStoreSettings[username] = null;
            utils.setLocalStorageItem(btoa(USER_STORE_SETTING_KEY), btoa(JSON.stringify(userStoreSettings)));

        },

        /**
         * Returns true if enableUserStoreCache() has previously been called and the user store
         * cache is active.
         * @alias isUserStoreCacheActive
         */
        isUserStoreCacheActive: function(){
            if( !services.auth.isLoggedIn() ){
                console.log('not logged in, cannot access user store');
                return;
            }
            var userStoreSettings;
            var username = services.auth.getLastKnownUsername();
            if( !username ){
                console.log('username not available, cannot access user store');
                return;
            }
            var userStoreSettingsStr = utils.getLocalStorageItem(btoa(USER_STORE_SETTING_KEY));
            if( !userStoreSettingsStr ){
                return false;
            }
            else{
                userStoreSettings = JSON.parse(atob(userStoreSettingsStr));
                return !!userStoreSettings[username];
            }
        },

        /**
         * Set an item by key and value in the user store. The user store is updated
         * on the server side user record 'custom' property.
         *
         * If the user store cache is active, the cache will also be updated.
         *
         * The userStore.last_updated property will be updated with the current time.
         * When the server side store is updated, this 'last_updated' timestamp will
         * be verified. If the server side timestamp is later than the previous 'last_updated'
         * timestamp, the operation will be rejected, and the returned promise will reject
         * with the current server side userStore value.
         *
         * The key and value must be parsable as JSON strings.
         *
         * @alias setItemInUserStore
         * @param {string} key the key
         * @param {string} value the value
         * @returns a Promise with no argument, if successful, or with the server side userStore if a conflict occurs
         */
        setItemInUserStore: function(key, value){
            return new Promise(function(resolve, reject) {
                function updateServerUserStore(userStore, previousLastUpdated){
                    return services.admin.getRealmUser().then(function(user){
                        var customProp = user.custom;
                        if( !customProp ){
                            user.custom = userStore;
                        }
                        else{
                            //compare timestamps
                            var customObj;
                            try{
                                customObj = JSON.parse(customProp);
                                var thatTS = customObj[LAST_UPDATED];
                                if( !thatTS || !previousLastUpdated){
                                    user.custom = userStore;
                                }
                                else{
                                    if( thatTS > previousLastUpdated ){
                                        console.log('ERROR: userStore update conflict' );
                                        reject(userStore);
                                        return;
                                    }
                                    else{
                                        user.custom = userStore;
                                    }
                                }
                            }
                            catch(e){
                                user.custom = userStore;
                            }

                        }
                        return services.admin.updateRealmUser({user: user}).then(function(){
                            resolve();
                        })['catch'](function(error){
                            console.log('could not update server side user object: ' + error);
                            reject('could not update server side user object: ' + error);
                        });
                    })
                }
                if( !key ){
                    reject('The key is required');
                    return;
                }

                return services.auth.getUserStore().then(function(userStore){
                    userStore[key] = value;
                    var prevTS = userStore[LAST_UPDATED];
                    userStore[LAST_UPDATED] = new Date().getTime();
                    if( services.auth.isUserStoreCacheActive() ){
                        return services.auth.saveUserStoreToCache().then(function(){
                            return updateServerUserStore(userStore, prevTS);
                        });
                    }
                    else{
                        return updateServerUserStore(userStore);
                    }
                })['catch'](function(error){
                    reject(error);
                })
            });
        },

        /**
         * Get an item by key from the user store. The user store is checked
         * on the server side user record 'custom' property.
         *
         * @alias getItemInUserStore
         * @param {string} key the key
         */
        getItemInUserStore: function(key){
            return new Promise(function(resolve, reject) {
                return services.auth.getUserStore().then(function(userStore){
                    resolve(userStore[key]);
                })['catch'](function(error){
                    reject(error);
                })
            });
        },

        /**
         * Get the user store for the current user. The user must be logged in to
         * access the store. The user store is persisted on the 'custom' property
         * of the user record, and can be used to store any relevant information for
         * user.
         *
         * @alias getUserStore
         * @returns A promise with the userStore object if successful.
         */
        getUserStore: function(){
            return new Promise(function(resolve, reject) {
                if( !services.auth.isLoggedIn() ){
                    console.log('not logged in, cannot access user store');
                    return null;
                }
                if( !(USER_STORE_KEY in window) ){
                    var userStoreCache;
                    if( services.auth.isUserStoreCacheActive()){
                        userStoreCache = services.auth.getUserStoreCache();
                    }
                    if( navigator.onLine ){
                        return services.admin.getRealmUser().then( function(user){
                            console.log('getUserStore() retrieved realm user');
                            var userStore = user.custom;
                            if( !userStore ){
                                userStore = {};
                            }
                            else if( typeof userStore === 'string'){
                                try{
                                    userStore = JSON.parse(userStore);
                                }
                                catch(e){
                                    userStore = {};
                                }
                            }
                            else if( typeof userStore !== 'object' ){
                                console.log('getUserStore() could not process user record store object: ' + userStore);
                                reject();
                                return;
                            }
                            window[USER_STORE_KEY] = userStore;
                            if( services.auth.isUserStoreCacheActive()){
                                return services.auth.saveUserStoreToCache().then(function(){
                                    return resolve(userStore);
                                });
                            }
                            else{
                                resolve(userStore);
                            }
                        })['catch'](function(error){
                            console.log('getUserStore() could not retrieve user from server: ' + error);
                            if( userStoreCache ){
                                resolve(userStoreCache);
                            }
                            else{
                                reject(error);
                            }

                        });
                    }
                    else if( userStoreCache ){
                        resolve(userStoreCache);
                    }
                    else{
                        reject('could not retrieve uncached user store while offline');
                    }

                }
                else{
                    resolve(window[USER_STORE_KEY]);
                }
            });
        },

        saveUserStoreToCache: function(){
            return new Promise(function(resolve, reject) {
                if( !services.auth.isLoggedIn() ){
                    console.log('not logged in, cannot access user store');
                    reject('not logged in, cannot access user store');
                    return;
                }
                if( !services.auth.isUserStoreCacheActive() ){
                    console.log('user store cache is not active, cannot save locally');
                    reject('user store cache is not active, cannot save locally')
                    return;
                }
                var username = services.auth.getLastKnownUsername();
                if( !username ){
                    console.log('username not available, cannot access user store');
                    reject('username not available, cannot access user store')
                    return;
                }
                else{
                    return services.auth.getUserStore().then(function(userStore){
                        var storeKeyCipher = btoa(USER_STORE_KEY);
                        var userStoreCacheStr = utils.getLocalStorageItem(storeKeyCipher);
                        var userStoreCache;
                        if( userStoreCacheStr ){
                            userStoreCache = JSON.parse(atob(userStoreCacheStr));
                        }
                        else{
                            userStoreCache = {};
                        }
                        userStoreCache[username] = userStore;
                        utils.setLocalStorageItem(storeKeyCipher, btoa(JSON.stringify(userStoreCache)));
                        resolve();
                        return;
                    })['catch'](function(error){
                        reject(error);
                        return;
                    })

                }
            });

        },

        getUserStoreCache: function(){
            if( !services.auth.isLoggedIn() ){
                console.log('not logged in, cannot access user store');
                reject('not logged in, cannot access user store');
                return;
            }
            if( !services.auth.isUserStoreCacheActive() ){
                console.log('user store cache is not active, cannot save locally');
                reject('user store cache is not active, cannot save locally')
                return;
            }
            var username = services.auth.getLastKnownUsername();
            if( !username ){
                console.log('username not available, cannot access user store');
                reject('username not available, cannot access user store')
                return;
            }
            var storeKeyCipher = btoa(USER_STORE_KEY);
            var userStoreCacheStr = utils.getLocalStorageItem(storeKeyCipher);
            var userStoreCache;
            if( userStoreCacheStr ){
                userStoreCache = JSON.parse(atob(userStoreCacheStr));
            }
            else{
                userStoreCache = {};
            }
            var userStoreCacheObject = userStoreCache[username];
            if( !userStoreCacheObject ){
                userStoreCacheObject = {};
            }
            return userStoreCacheObject;
        }

    };
}
