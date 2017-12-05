function AuthService(v, keys, utils) {

    var authKeys = {
        PASSWORD_KEY: 'voyentPassword',
        SCOPE_TO_PATH_KEY: "voyentScopeToPath",
        CONNECT_SETTINGS_KEY: 'voyentConnectSettings',
        RELOGIN_CB_KEY: 'voyentReloginCallback',
        LAST_ACTIVE_TS_KEY: 'voyentLastActiveTimestamp'
    };

    function validateAndReturnRequiredRole(params, reject){
        var role = params.role;
        if( role ){
            return role;
        }
        else{
            return reject(Error('The Voyent role parameter is required'));
        }
    }

    function validateAndReturnRequiredRoles(params, reject){
        var roles = params.roles;
        if( roles ){
            return roles;
        }
        else{
            return reject(Error('The Voyent roles parameter is required'));
        }
    }

    function fireEvent(el, eventName, detail) {
        var event;
        if ('CustomEvent' in window) {
            event = new CustomEvent(eventName, {'detail': detail});
        }
        else if (document.createEvent) {//IE 10 & other older browsers
            event = document.createEvent('HTMLEvents');
            event.initEvent(eventName, true, true);
        }
        else if (document.createEventObject) {// IE < 9
            event = document.createEventObject();
            event.eventType = eventName;
        }
        event.eventName = eventName;
        if (el.dispatchEvent) {
            el.dispatchEvent(event);
        } else if (el.fireEvent && htmlEvents['on' + eventName]) {// IE < 9
            el.fireEvent('on' + event.eventType, event);// can trigger only real event (e.g. 'click')
        } else if (el[eventName]) {
            el[eventName]();
        } else if (el['on' + eventName]) {
            el['on' + eventName]();
        }
    }

    return {

        /**
         * Retrieve a new access token from the Voyent auth service.
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
         * @memberOf voyent.auth
         * @alias getNewAccessToken
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name (required)
         * @param {String} params.realm Voyent Services realm (required only for non-admin logins)
         * @param {String} params.username User name (required)
         * @param {String} params.password User password (required)
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {Promise} with the following argument:
         *      {
		 *          access_token: 'xxx',
		 *          expires_in: 99999
		 *      }
         *
         */
        getNewAccessToken: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    if (!params.realm) {
                        params.realm = 'admin';
                    }

                    //validation
                    if (!params.account) {
                        reject(Error('Voyent account required for new access token'));
                        return;
                    }
                    if (!params.password) {
                        reject(Error('password required for new access token'));
                        return;
                    }
                    if (!params.username) {
                        reject(Error('username required for new access token'));
                        return;
                    }
                    var url = utils.determineProtocol(params.ssl) + v.authURL + '/' + encodeURI(params.account) +
                        '/realms/' + encodeURI(params.realm) + '/token/?' + utils.getTransactionURLParam();

                    v.$.post(url, {
                        strategy: 'query',
                        username: params.username,
                        password: params.password
                    }).then(function (authResponse) {
                        resolve(authResponse);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Login into voyent.
         *
         * This function will login into the Voyent auth service and return a user token and expiry timestamp upon
         * successful authentication. This function does not need to be called if v.connect has already been
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
         * @memberOf voyent.auth
         * @alias login
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name (required)
         * @param {String} params.realm Voyent Services realm (required only for non-admin logins)
         * @param {Boolean} params.admin The client should or should not log in as an account administrator
         * @param {String} params.username User name (required)
         * @param {String} params.password User password (required)
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {String} params.scopeToPath (default '/') If set, the authentication token will be restricted to the
         *     given path, unless on localhost.
         * @returns {Promise} with the following argument:
         *      {
		 *          access_token: 'xxx',
		 *          expires_in: 99999
		 *      }
         *
         */
        login: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                if (!params.realm) {
                    params.realm = 'admin';
                }

                //validation
                if (!params.account) {
                    reject(Error('Voyent account required for login'));
                    return;
                }
                if (!params.password) {
                    reject(Error('password required for login'));
                    return;
                }
                if (!params.username) {
                    reject(Error('username required for login'));
                    return;
                }
                var txParam = utils.getTransactionURLParam();
                var url = utils.determineProtocol(params.ssl) + v.authURL + '/' + encodeURI(params.account) +
                    '/realms/' + (params.admin === 'true' ? 'admin' : encodeURI(params.realm)) + '/token/' + ( txParam ? ('?' + txParam) : '');

                var loggedInAt = new Date().getTime();
                v.$.post(url, {
                    strategy: 'query',
                    username: params.username,
                    password: params.password
                }).then(function (authResponse) {
                    if (!params.suppressUpdateTimestamp) {
                        v.auth.updateLastActiveTimestamp();
                    }
                    utils.setSessionStorageItem(btoa(keys.TOKEN_KEY), authResponse.access_token);
                    utils.setSessionStorageItem(btoa(keys.TOKEN_EXPIRES_KEY), authResponse.expires_in);
                    utils.setSessionStorageItem(btoa(keys.TOKEN_SET_KEY), loggedInAt);
                    utils.setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(params.account));
                    if (params.host) {
                        utils.setSessionStorageItem(btoa(keys.HOST_KEY), btoa(params.host));
                    }
                    utils.setSessionStorageItem(btoa(keys.REALM_KEY), btoa(params.realm));
                    utils.setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(params.username));
                    utils.setSessionStorageItem(btoa(keys.ADMIN_KEY), btoa(params.admin));
                    if (params.scopeToPath) {
                        utils.setSessionStorageItem(btoa(authKeys.SCOPE_TO_PATH_KEY), btoa(params.scopeToPath));
                    }
                    fireEvent(window, 'voyent-login-succeeded', {});
                    resolve(authResponse);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },
        
        /**
         * Store various login variables from an external source
         *
         * @memberOf voyent.auth
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name (required)
         * @param {String} params.realm Voyent Services realm (required)
         * @param {String} params.username User name (required)
         * @param {String} params.access_token Valid access token (required)
         * @param {String} params.expires_in Token expiry, in milliseconds (required)
         */
        _storeLogin: function(params) {
            if (!params.access_token) {
                reject(Error('Voyent access token is required'));
                return;
            }
            if (!params.expires_in) {
                reject(Error('Voyent access token expiry is required'));
                return;
            }
            if (!params.account) {
                reject(Error('Voyent account is required'));
                return;
            }
            if (!params.realm) {
                reject(Error('Voyent realm is required'));
                return;
            }
            if (!params.username) {
                reject(Error('Voyent username is required'));
                return;
            }
            
            v.auth.updateLastActiveTimestamp();
            utils.setSessionStorageItem(btoa(keys.TOKEN_KEY), params.access_token);
            utils.setSessionStorageItem(btoa(keys.TOKEN_EXPIRES_KEY), params.expires_in);
            utils.setSessionStorageItem(btoa(keys.TOKEN_SET_KEY), new Date().getTime());
            utils.setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(params.account));
            utils.setSessionStorageItem(btoa(keys.REALM_KEY), btoa(params.realm));
            utils.setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(params.username));
        },

        /**
         * Connect to voyent.
         *
         * This function will connect to the Voyent voyent, and maintain the connection for the specified
         * timeout period (default 20 minutes). By default, the Voyent push service is also activated, so the client
         * may send and receive push notifications after connecting.
         *
         * After connecting to Voyent Services, any Voyent service API may be used without needing to re-authenticate.
         * After successfully connecting an authentication will be stored in session storage and available through
         * sessionStorage.voyentToken. This authentication information will automatically be used by other Voyent API
         * calls, so the token does not be included in subsequent calls, but is available if desired.
         *
         * A simple example of connecting to the Voyent Services and then making a service call is the following:
         * @example
         * v.connect({
		 *           account: 'my_account',
		 *           realm: 'realmA',
		 *           user: 'user',
		 *           password: 'secret'})
         *   .then( function(){
		 *      console.log("successfully connnected to Voyent Services");
		 *   })
         *   .then( function(docs){
		 *      for( var d in docs ){ ... };
		 *   })
         *   .catch( function(error){
		 *      console.log("error connecting to Voyent Services: " + error);
		 *   });
         *
         * @memberOf voyent.auth
         * @alias connect
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name
         * @param {Boolean} params.admin The client should or should not log in as an account administrator
         * @param {String} params.realm Voyent Services realm
         * @param {String} params.username User name
         * @param {String} params.password User password
         * @param {String} params.host The Voyent Services host url, defaults to api.voyent.cloud
         * @param {Boolean} params.usePushService Open and connect to the Voyent push service, default true
         * @param {Boolean} params.connectionTimeout The timeout duration, in minutes, that the Voyent login will last
         *     during inactivity. Default 20 minutes.
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Boolean} params.storeCredentials (default true) Whether to store encrypted credentials in session
         *     storage. If set to false, voyent will not attempt to relogin before the session expires.
         * @param {Function} params.onSessionExpiry Function callback to be called on session expiry. If you wish to
         *     ensure that disconnect is not called until after your onSessionExpiry callback has completed, please
         *     return a Promise from your function.
         * @param {String} params.scopeToPath (default '/') If set, the authentication token will be restricted to the
         *     given path, unless on localhost.
         * @returns Promise with service definitions
         *
         */
        connect: function (params) {
            return new Promise(function (resolve, reject) {

                /* The function callback set to run before the next timeout,
                 will automatically reset the next setTimeout call if necessary */
                function connectCallback() {
                    console.log(new Date().toISOString() + ' voyent.auth.connect: callback running');
                    var connectSettings = v.auth.getConnectSettings();
                    if (!connectSettings) {
                        console.log(new Date().toISOString() + ' voyent.auth.connect: error, could not retrieve settings');
                        return;
                    }

                    var timeoutMillis = connectSettings.connectionTimeout * 60 * 1000;

                    //first check if connectionTimeout has expired
                    var now = new Date().getTime();
                    var inactiveMillis = now - v.auth.getLastActiveTimestamp();
                    var millisUntilTimeoutExpires = timeoutMillis - inactiveMillis;
                    console.log('voyent.auth.connect: getLastActiveTimestamp: ' + v.auth.getLastActiveTimestamp());
                    console.log('voyent.auth.connect: connection timeout ms: ' + timeoutMillis);
                    console.log('voyent.auth.connect: current timestamp: ' + now);
                    console.log('voyent.auth.connect: inactive ms: ' + inactiveMillis + '(' + (inactiveMillis / 1000 / 60) + ' mins)');
                    console.log('voyent.auth.connect: ms until timeout: ' + millisUntilTimeoutExpires + '(' + (millisUntilTimeoutExpires / 1000 / 60) + ' mins)');

                    //if we haven't exceeded the connection timeout, reconnect
                    if (millisUntilTimeoutExpires > 0) {
                        console.log(new Date().toISOString() + ' voyent.auth.connect: timeout has not been exceeded, ' +
                            v.auth.getTimeRemainingBeforeExpiry() / 1000 / 60 + ' mins remaining before token expires, ' +
                            millisUntilTimeoutExpires / 1000 / 60 + ' mins remaining before timeout expires');

                        //if we the time remaining before expiry is less than the session timeout
                        //refresh the access token and set the timeout
                        if (timeoutMillis > millisUntilTimeoutExpires) {
                            v.auth.refreshAccessToken().then(function () {
                                var cbId = setTimeout(connectCallback, v.auth.getExpiresIn() - timeoutPadding);
                                utils.setSessionStorageItem(btoa(authKeys.RELOGIN_CB_KEY), cbId);
                                console.log(new Date().toISOString() + ' voyent.auth.connect: setting next connection check to ' + v.auth.getExpiresIn() / 1000 / 60 + ' mins, expiresIn: ' +
                                    (v.auth.getExpiresIn() / 1000 / 60) + ' mins, remaining: ' +
                                    (v.auth.getTimeRemainingBeforeExpiry() / 1000 / 60) + ' mins');

                            });
                        }
                    } else {
                        console.log(new Date().toISOString() + ' voyent.auth.connect: timeout has expired, disconnecting..');

                        //look for the onSessionExpiry callback on the params first,
                        //as functions could be passed by reference
                        //secondly by settings, which would only be passed by name
                        var expiredCallback = params.onSessionExpiry;
                        if (!expiredCallback) {
                            expiredCallback = connectSettings.onSessionExpiry;
                        }

                        //if there's no onSessionExpiry, call disconnect immediately
                        //otherwise search for onSessionExpiry function, if not found
                        //call disconnect() immediately, otherwise call onSessionExpiry
                        //if callback if a promise, wait until the promise completes
                        //before disconnecting, otherwise, wait 500ms then disconnect
                        if (expiredCallback) {
                            var expiredCallbackFunction;
                            if (typeof expiredCallback === 'function') {
                                expiredCallbackFunction = expiredCallback;
                            }
                            else if (typeof expiredCallback === 'string') {
                                expiredCallbackFunction = utils.findFunctionInGlobalScope(expiredCallback);
                            }
                            if (expiredCallbackFunction) {
                                var expiredCallbackPromise = expiredCallbackFunction();
                                if (expiredCallbackPromise && expiredCallbackPromise.then) {
                                    expiredCallbackPromise.then(v.auth.disconnect)
                                        ['catch'](v.auth.disconnect);
                                }
                                else {
                                    setTimeout(v.auth.disconnect, 500);
                                }
                            }
                            else {
                                console.log(new Date().toISOString() + ' voyent.auth.connect: error calling onSessionExpiry callback, ' +
                                    'could not find function: ' + expiredCallback);
                                v.auth.disconnect();
                            }

                        }
                        else {
                            v.auth.disconnect();
                        }

                    }
                }

                /* initialize the timing for the callback check */
                function initConnectCallback() {

                    //if the desired connection timeout is greater the token expiry
                    //set the callback check for just before the token expires
                    var callbackTimeout;
                    if (connectionTimeoutMillis > v.auth.getTimeRemainingBeforeExpiry()) {
                        callbackTimeout = v.auth.getTimeRemainingBeforeExpiry() - timeoutPadding;
                    }
                    //otherwise the disired timeout is less then the token expiry
                    //so set the callback to happen just at specified timeout
                    else {
                        callbackTimeout = connectionTimeoutMillis;
                    }

                    var tokenSetAt = new Date();
                    tokenSetAt.setTime(v.auth.getTokenSetAtTime());
                    console.log(new Date().toISOString() + ' voyent.auth.connect: setting next connection check to ' + callbackTimeout / 1000 / 60 + ' mins, expiresIn: ' +
                        (v.auth.getExpiresIn() / 1000 / 60) + ' mins, remaining: ' +
                        (v.auth.getTimeRemainingBeforeExpiry() / 1000 / 60) + ' mins, token set at ' + tokenSetAt);
                    var cbId = setTimeout(connectCallback, callbackTimeout);
                    utils.setSessionStorageItem(btoa(authKeys.RELOGIN_CB_KEY), cbId);

                    if (settings.usePushService) {
                        // v.push.startPushService(settings);
                    }
                    v.auth.connected = true;
                }

                /* initialize basic settings */
                function initSettings() {

                    params = params ? params : {};
                    v.checkHost(params);
                    if (!params.storeCredentials) {
                        params.storeCredentials = true;
                    }

                    //store connect settings
                    settings = {
                        host: v.baseURL,
                        usePushService: params.usePushService,
                        connectionTimeout: params.connectionTimeout || 20,
                        ssl: params.ssl,
                        storeCredentials: params.storeCredentials || true,
                        onSessionExpiry: params.onSessionExpiry,
                        admin: params.admin
                    };
                    if (params.scopeToPath) {
                        settings.scopeToPath = params.scopeToPath;
                    }

                    //settings.connectionTimeout = 5;

                    utils.setSessionStorageItem(btoa(authKeys.CONNECT_SETTINGS_KEY), btoa(JSON.stringify(settings)));

                    if (params.onSessionExpiry) {
                        if (typeof params.onSessionExpiry === 'function') {
                            var name = utils.getFunctionName(params.onSessionExpiry);
                            if (name) {
                                settings.onSessionExpiry = name;
                            }
                        }
                    }


                    connectionTimeoutMillis = (settings.connectionTimeout) * 60 * 1000;

                }

                /* store the provided credentials */
                function saveCredentials() {
                    utils.setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(v.auth.getLastKnownAccount()));
                    utils.setSessionStorageItem(btoa(keys.REALM_KEY), btoa(v.auth.getLastKnownRealm()));
                    utils.setSessionStorageItem(btoa(keys.HOST_KEY), btoa(v.auth.getLastKnownHost()));
                    utils.setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(params.username));
                    utils.setSessionStorageItem(btoa(authKeys.PASSWORD_KEY), btoa(params.password));
                }

                var timeoutPadding = 60000;
                var settings;
                var connectionTimeoutMillis;
                initSettings();

                if (v.auth.isLoggedIn()) {
                    initConnectCallback();
                    resolve();
                }
                else {
                    v.auth.login(params).then(function (authResponse) {
                        console.log(new Date().toISOString() + ' voyent.auth.connect: received auth response');
                        saveCredentials();
                        initConnectCallback();
                        resolve(authResponse);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            });
        },

        refreshAccessToken: function () {
            return new Promise(function (resolve, reject) {
                if (!v.auth.isLoggedIn()) {
                    reject('voyent.auth.refreshAccessToken() not logged in, cant refresh token');
                }
                else {
                    var loginParams = v.auth.getConnectSettings();
                    if (!loginParams) {
                        reject('voyent.auth.refreshAccessToken() no connect settings, cant refresh token');
                    }
                    else {
                        loginParams.account = atob(utils.getSessionStorageItem(btoa(keys.ACCOUNT_KEY)));
                        loginParams.realm = atob(utils.getSessionStorageItem(btoa(keys.REALM_KEY)));
                        loginParams.host = atob(utils.getSessionStorageItem(btoa(keys.HOST_KEY)));
                        loginParams.username = atob(utils.getSessionStorageItem(btoa(keys.USERNAME_KEY)));
                        loginParams.password = atob(utils.getSessionStorageItem(btoa(authKeys.PASSWORD_KEY)));
                        loginParams.suppressUpdateTimestamp = true;
                        loginParams.admin = atob(utils.getSessionStorageItem(btoa(keys.ADMIN_KEY)));
                        console.log('voyent.auth.refreshAccessToken()');
                        v.auth.login(loginParams).then(function (authResponse) {
                            fireEvent(window, 'voyent-access-token-refreshed', v.auth.getLastAccessToken());
                            if (loginParams.usePushService) {
                                // v.push.startPushService(loginParams);
                            }
                            resolve(authResponse);
                        })['catch'](function (response) {
                            reject(response);
                        });
                    }
                }

            });
        },

        /**
         * Disconnect from Voyent Services.
         *
         * This function will logout from Voyent Services and remove all session information from the client.
         *
         * TODO
         *
         * @memberOf voyent.auth
         * @alias disconnect
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.username User name (required)
         * @param {String} params.password User password (required)
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns {Promise} with the following argument:
         *      {
		 *          access_token: 'xxx',
		 *          expires_in: 99999
		 *      }
         *
         */
        disconnect: function () {
            utils.removeSessionStorageItem(btoa(keys.TOKEN_KEY));
            utils.removeSessionStorageItem(btoa(keys.TOKEN_EXPIRES_KEY));
            utils.removeSessionStorageItem(btoa(authKeys.CONNECT_SETTINGS_KEY));
            utils.removeSessionStorageItem(btoa(keys.TOKEN_SET_KEY));
            utils.removeSessionStorageItem(btoa(keys.ACCOUNT_KEY));
            utils.removeSessionStorageItem(btoa(keys.REALM_KEY));
            utils.removeSessionStorageItem(btoa(keys.USERNAME_KEY));
            utils.removeSessionStorageItem(btoa(keys.HOST_KEY));
            utils.removeSessionStorageItem(btoa(authKeys.PASSWORD_KEY));
            utils.removeSessionStorageItem(btoa(authKeys.LAST_ACTIVE_TS_KEY));
            var cbId = utils.getSessionStorageItem(btoa(authKeys.RELOGIN_CB_KEY));
            if (cbId) {
                clearTimeout(cbId);
            }
            utils.removeSessionStorageItem(btoa(authKeys.RELOGIN_CB_KEY));
            console.log(new Date().toISOString() + ' voyent has disconnected');
            v.auth.connected = false;
        },

        getLastAccessToken: function () {
            return utils.getSessionStorageItem(btoa(keys.TOKEN_KEY));
        },

        getExpiresIn: function () {
            var expiresInStr = utils.getSessionStorageItem(btoa(keys.TOKEN_EXPIRES_KEY));
            if (expiresInStr) {
                return parseInt(expiresInStr, 10);
            }
        },

        getTokenSetAtTime: function () {
            var tokenSetAtStr = utils.getSessionStorageItem(btoa(keys.TOKEN_SET_KEY));
            if (tokenSetAtStr) {
                return parseInt(tokenSetAtStr, 10);
            }
        },

        getTimeRemainingBeforeExpiry: function () {
            var expiresIn = v.auth.getExpiresIn();
            var token = v.auth.getLastAccessToken();
            if (expiresIn && token) {
                var now = new Date().getTime();
                return (v.auth.getTokenSetAtTime() + expiresIn) - now;
            }
        },

        getConnectSettings: function () {
            var settingsStr = utils.getSessionStorageItem(btoa(authKeys.CONNECT_SETTINGS_KEY));
            if (settingsStr) {
                return JSON.parse(atob(settingsStr));
            }
        },

        isLoggedIn: function () {
            var token = utils.getSessionStorageItem(btoa(keys.TOKEN_KEY)),
                tokenExpiresInStr = utils.getSessionStorageItem(btoa(keys.TOKEN_EXPIRES_KEY)),
                tokenExpiresIn = tokenExpiresInStr ? parseInt(tokenExpiresInStr, 10) : null,
                tokenSetAtStr = utils.getSessionStorageItem(btoa(keys.TOKEN_SET_KEY)),
                tokenSetAt = tokenSetAtStr ? parseInt(tokenSetAtStr, 10) : null,
                scopeToPathCipher = utils.getSessionStorageItem(btoa(authKeys.SCOPE_TO_PATH_KEY)),
                scopeToPath = scopeToPathCipher ? atob(scopeToPathCipher) : '/',
                isDev, currentPath;
            if (!utils.isNode) {
                isDev = window.location.port !== '';
                currentPath = window.location.pathname;
            }
            //console.log('v.auth.isLoggedIn: token=' + token + ' tokenExpiresIn=' + tokenExpiresIn + 'tokenSetAt=' + tokenSetAt + ' (new Date().getTime() < (tokenExpiresIn + tokenSetAt))=' + (new Date().getTime() < (tokenExpiresIn + tokenSetAt)) + ' (currentPath.indexOf(scopeToPath) === 0)=' + (currentPath.indexOf(scopeToPath) === 0));
            var result = token && tokenExpiresIn && tokenSetAt && (new Date().getTime() < (tokenExpiresIn + tokenSetAt) ) && (utils.isNode || (!utils.isNode && (isDev || currentPath.indexOf(scopeToPath) === 0)));
            return !!result;
        },

        getLastKnownAccount: function () {
            var accountCipher = utils.getSessionStorageItem(btoa(keys.ACCOUNT_KEY));
            if (accountCipher) {
                return atob(accountCipher);
            }
        },

        getLastKnownRealm: function () {
            var realmCipher = utils.getSessionStorageItem(btoa(keys.REALM_KEY));
            if (realmCipher) {
                return atob(realmCipher);
            }
        },

        getLastKnownUsername: function () {
            var usernameCipher = utils.getSessionStorageItem(btoa(keys.USERNAME_KEY));
            if (usernameCipher) {
                return atob(usernameCipher);
            }
        },

        getLastKnownHost: function () {
            var hostCipher = utils.getSessionStorageItem(btoa(keys.HOST_KEY));
            if (hostCipher) {
                return atob(hostCipher);
            }
        },

        /**
         * Register a new user for a realm that supports open user registrations.
         *
         * @memberOf voyent.auth
         * @alias registerAsNewUser
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.username User name (required)
         * @param {String} params.password User password (required)
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {String} params.firstname The user's first name (optional)
         * @param {String} params.lastname The user's last name (optional)
         * @param {String} params.email The user's email (optional)
         * @param {Object} params.custom Custom user information
         * @returns Promise
         */
        registerAsNewUser: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    utils.validateRequiredUsername(params, reject);
                    utils.validateRequiredPassword(params, reject);

                    var user = {
                        username: params.username,
                        password: params.password
                    };

                    if ('firstname' in params) {
                        user.firstname = params.firstname;
                    }
                    if ('lastname' in params) {
                        user.lastname = params.lastname;
                    }
                    if ('email' in params) {
                        user.email = params.email;
                    }
                    if ('custom' in params) {
                        user.custom = params.custom;
                    }

                    var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                        'quickuser', token, params.ssl);

                    v.$.post(url, {user: user}).then(function (response) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function (error) {
                        reject(error);
                    });
                }
            );
        },

        /**
         * Check if the current user has a single role.
         *
         * @memberOf voyent.auth
         * @alias checkUserRole
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {String} params.role The single role to check for
         * @returns Promise
         */
        checkUserRole: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var role = validateAndReturnRequiredRole(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'rolecheck/', token, params.ssl, {roleName: role});

                v.$.getJSON(url).then(function (response) {
                    if (response.results) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(true);
                    }
                    else {
                        reject(response);
                    }
                })['catch'](function (response) {
                    if (response.status == 403) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(false);
                    }
                    else {
                        reject(response);
                    }
                });
            });
        },

        /**
         * Check if the current user has a set of roles. The 'op' params can be added to check for 'or' or 'and'.
         *
         * @memberOf voyent.auth
         * @alias checkUserRole
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
         *     will be used.
         * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
         *     will be used.
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {Array} params.roles The array of roles to check for
         * @param {Array} params.roles The array of roles to check for
         * @param {String} params.op The operator 'and' or 'or' ??? TODO
         * @param {String} params.username The username parameter TODO may be later removed
         *     http://jira.icesoft.org/browse/NTFY-216
         * @returns Promise
         */
        checkUserRoles: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var roles = validateAndReturnRequiredRoles(params, reject);
                var username = utils.validateAndReturnRequiredUsername(params, reject);

                var payload = {
                    roleBlock: [{
                        name: 'first',
                        roles: roles,
                        op: params.op
                    }]
                };

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'users/' + username + '/rolecheck', token, params.ssl);

                v.$.post(url, payload).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(true);
                })['catch'](function (response) {
                    if (response.status == 403) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(false);
                    }
                    else {
                        reject(response);
                    }
                });
            });
        },


        /**
         * Update the last active timestamp for Voyent auth. This value is used
         * when checking for clients-side session timeouts.
         * @memberOf voyent.auth
         * @alias updateLastActiveTimestamp
         */
        updateLastActiveTimestamp: function () {
            utils.setSessionStorageItem(btoa(authKeys.LAST_ACTIVE_TS_KEY), new Date().getTime());
        },

        /**
         * Return the timestamp of the last voyent op or when voyent.auth.updateLastActiveTimestamp()
         * was called.
         * @memberOf voyent.auth
         * @alias getLastActiveTimestamp
         */
        getLastActiveTimestamp: function () {
            return utils.getSessionStorageItem(btoa(authKeys.LAST_ACTIVE_TS_KEY));
        },

        forgotPassword: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var username = utils.validateAndReturnRequiredUsername(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = utils.determineProtocol(params.ssl) + v.authAdminURL + '/' + account + '/';

                if (params.realm) {
                    url += 'realms/' + params.realm + '/users/' + username + '/emailpassword';
                }
                else { //admin
                    url += 'admins/' + username + '/emailpassword';
                }
                url += (txParam ? '?' + txParam : '');

                v.$.post(url).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(true);
                })['catch'](function (response) {
                    reject(response);
                });
            });
        },

        /**
         * Return a generated password that matches the requirements of our service
         * Specifically: /^[A-Za-z0-9!@#%^&*_\s]*$/
         * This can be leveraged as part of anonymous user creation
         *
         * Credit goes to http://stackoverflow.com/a/12635919
         *
         * @returns String password
         */
        generatePassword: function () {
            var specials = '!@#%^&*_';
            var lowercase = 'abcdefghijklmnopqrstuvwxyz';
            var uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            var numbers = '0123456789';
            var all = specials + lowercase + uppercase + numbers;

            String.prototype.pick = function (min, max) {
                var n, chars = '';

                if (typeof max === 'undefined') {
                    n = min;
                } else {
                    n = min + Math.floor(Math.random() * (max - min));
                }

                for (var i = 0; i < n; i++) {
                    chars += this.charAt(Math.floor(Math.random() * this.length));
                }

                return chars;
            };

            String.prototype.shuffle = function () {
                var array = this.split('');
                var tmp, current, top = array.length;

                if (top) while (--top) {
                    current = Math.floor(Math.random() * (top + 1));
                    tmp = array[current];
                    array[current] = array[top];
                    array[top] = tmp;
                }

                return array.join('');
            };

            return (specials.pick(1) + lowercase.pick(1) + uppercase.pick(1) + all.pick(5, 10)).shuffle();
        }
    };
}
