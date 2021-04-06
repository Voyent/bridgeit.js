function AuthService(v, keys, utils) {

    var authKeys = {
        PASSWORD_KEY: 'voyentPassword_vras',
        SCOPE_TO_PATH_KEY: "voyentScopeToPath_vras",
        CONNECT_SETTINGS_KEY: 'voyentConnectSettings_vras',
        REFRESH_TOKEN_CB_KEY: 'voyentTokenRefreshCallback',
        INACTIVITY_CB_KEY: 'voyentInactivityCallback',
        LAST_ACTIVE_TS_KEY: 'voyentLastActiveTimestamp_vras'
    };

    // How long before the token expiry that the token will be refreshed (2 minutes).
    var tokenRefreshPadding = 2 * 60 * 1000;
    // How long the user is allowed to be inactive before the session is disconnected (20 minutes).
    var inactivityTimeout = 20 * 60 * 1000;

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

    var voyentAuth = {

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
                    var url = v.authURL + '/' + encodeURI(params.account) +
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
                var url = v.authURL + '/' + encodeURI(params.account) +
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
                    utils.setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(utils.sanitizeAccountName(params.account)));
                    if (params.host) {
                        utils.setSessionStorageItem(btoa(keys.HOST_KEY), btoa(params.host));
                    }
                    utils.setSessionStorageItem(btoa(keys.REALM_KEY), btoa(params.realm));
                    utils.setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(params.username));
                    utils.setSessionStorageItem(btoa(keys.ADMIN_KEY), btoa(params.admin));
                    if (params.scopeToPath) {
                        utils.setSessionStorageItem(btoa(authKeys.SCOPE_TO_PATH_KEY), btoa(params.scopeToPath));
                    }
                    v._fireEvent(window, 'voyent-login-succeeded-vras', {});
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
            return new Promise(function(resolve, reject) {
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
                utils.setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(utils.sanitizeAccountName(params.account)));
                utils.setSessionStorageItem(btoa(keys.REALM_KEY), btoa(params.realm));
                utils.setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(params.username));
                if (params.scopeToPath) {
                    utils.setSessionStorageItem(btoa(authKeys.SCOPE_TO_PATH_KEY), btoa(params.scopeToPath));
                }
                
                resolve();
            });
        },

        /**
         * Connects to the Voyent Alert! system and maintains the session permanently as long as the user
         * is not inactive for the time specified in the `inactivityTimeout` variable (default 20 mins).
         *
         * @memberOf voyent.auth
         * @alias connect
         * @param {Object} params params
         * @param {String} params.account Voyent Services account name
         * @param {String} params.username User name
         * @param {String} params.password User password
         * @param {String} [params.realm] Voyent Services realm
         * @param {Boolean} [params.admin] The client should or should not log in as an account administrator
         * @param {String} [params.host] The Voyent Services host url, defaults to api.voyent.cloud
         * @param {String} [params.scopeToPath] (default '/') If set, the authentication token will be
         * restricted to the given path, unless on localhost.
         * @returns Promise with service definitions
         *
         */
        connect: function(params) {
            return new Promise(function (resolve, reject) {

                params = params ? params : {};

                // Build and store the connection settings so we
                // can access them when refreshing the token.
                var settings = {
                    host: v.baseURL
                };
                if (params.admin) {
                    settings.admin = params.admin;
                }
                if (params.scopeToPath) {
                    settings.scopeToPath = params.scopeToPath;
                }

                utils.setSessionStorageItem(btoa(authKeys.CONNECT_SETTINGS_KEY), btoa(JSON.stringify(settings)));

                if (v.auth.isLoggedIn()) {
                    // Start the session timers and resolve.
                    v.auth.startSessionTimers();
                    resolve();
                }
                else {
                    v.auth.login(params).then(function (authResponse) {
                        // Set the username from the response so we have
                        // the exact username with proper letter casing.
                        if (authResponse.username) {
                            params.username = authResponse.username;
                        }
                        // Store the credentials.
                        utils.setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(v.auth.getLastKnownAccount()));
                        utils.setSessionStorageItem(btoa(keys.REALM_KEY), btoa(v.auth.getLastKnownRealm()));
                        utils.setSessionStorageItem(btoa(keys.HOST_KEY), btoa(v.auth.getLastKnownHost()));
                        utils.setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(params.username));
                        utils.setSessionStorageItem(btoa(authKeys.PASSWORD_KEY), btoa(params.password));
                        // Start the session timers and resolve.
                        v.auth.startSessionTimers();
                        resolve(authResponse);
                    }).catch(function (error) {
                        reject(error);
                    });
                }
            });
        },

        /**
         * Starts the token and inactive session timers.
         */
        startSessionTimers: function() {
            v.auth.startTokenExpiryTimer();
            v.auth.startInactiveSessionTimer();
        },

        /**
         * Starts the token expiry timer. The token will be refreshed
         * automatically `tokenRefreshPadding` ms before the expiry.
         */
        startTokenExpiryTimer: function() {

            var refreshTokenAt = v.auth.getTimeRemainingBeforeExpiry() - tokenRefreshPadding;

            console.log('POLYMER:', new Date().toISOString(), 'token has',
                (v.auth.getTimeRemainingBeforeExpiry() / 1000 / 60).toPrecision(4), '/',
                (v.auth.getExpiresIn() / 1000 / 60).toPrecision(4), 'mins remaining.',
                'refreshing token in', (refreshTokenAt / 1000 / 60).toPrecision(4), 'mins.'
            );

            var refreshTokenTimeoutCb = setTimeout(function() {
                v.auth.refreshAccessToken().then(function () {
                    v.auth.startTokenExpiryTimer();
                }).catch(function() {});
            }, refreshTokenAt);
            utils.setSessionStorageItem(btoa(authKeys.REFRESH_TOKEN_CB_KEY), refreshTokenTimeoutCb);
        },

        /**
         * Starts the inactive session timer. The session will be
         * disconnected after `inactivityTimeout` ms of inactivity.
         */
        startInactiveSessionTimer: function() {

            var inactivityTimeoutCb = setTimeout(function() {

                var inactiveMillis = new Date().getTime() - v.auth.getLastActiveTimestamp();
                console.log('POLYMER:', new Date().toISOString(), 'user has been inactive for',
                    (inactiveMillis / 1000 / 60).toPrecision(4), '/',
                    (inactivityTimeout / 1000 / 60).toPrecision(4), 'mins.'
                );
                v.auth.disconnectSession();

            }, inactivityTimeout);
            utils.setSessionStorageItem(btoa(authKeys.INACTIVITY_CB_KEY), inactivityTimeoutCb);
        },

        /**
         * Removes the current inactive session timer and creates a new one if the session is
         * still valid. If the session is no longer valid the user will be disconnected.
         */
        resetInactiveSessionTimer: function() {

            var inactivityTimeoutCb = utils.getSessionStorageItem(btoa(authKeys.INACTIVITY_CB_KEY));
            if (inactivityTimeoutCb) {
                clearTimeout(parseInt(inactivityTimeoutCb));
                utils.removeSessionStorageItem(btoa(authKeys.INACTIVITY_CB_KEY));
            }

            // Before restarting the inactivity timer ensure the session is valid first.
            // This catches the case where the user puts their computer to sleep with the
            // web app open and then tries to interact with the app after returning.
            if (v.auth.getTimeRemainingBeforeExpiry() <= 0) {
                var remainingMins = (v.auth.getTimeRemainingBeforeExpiry() / 1000 / 60).toPrecision(4);
                console.log('POLYMER: disconnecting session because it expired', remainingMins, 'mins ago.');
                v.auth.disconnectSession();
            }
            else {
                v.auth.startInactiveSessionTimer();
            }
        },

        /**
         * Disconnects the Voyent Alert! session and fires the `voyent-session-expired` event.
         */
        disconnectSession: function() {
            console.log('POLYMER: inactivity timeout has been exceeded or token has expired, disconnecting...');
            v.auth.disconnect();
            v._fireEvent(window, 'voyent-session-expired-vras', {});
        },

        refreshAccessToken: function(isRetryAttempt) {
            console.log('POLYMER: refreshAccessToken triggered');
            return new Promise(function (resolve, reject) {
                if (!v.auth.isLoggedIn()) {
                    console.log('POLYMER: firing `voyent-access-token-refresh-failed-vras` because user is not logged in');
                    v._fireEvent(window, 'voyent-access-token-refresh-failed-vras', {});
                    reject('voyent.auth.refreshAccessToken() not logged in, cant refresh token');
                }
                else {
                    var loginParams = v.auth.getLoginParams();
                    if (!loginParams) {
                        console.log('POLYMER: firing `voyent-access-token-refresh-failed-vras` because there are no `loginParams`', loginParams);
                        v._fireEvent(window, 'voyent-access-token-refresh-failed-vras', {});
                        reject('voyent.auth.refreshAccessToken() no connect settings, cant refresh token');
                    }
                    else {
                        console.log('POLYMER: refreshing access_token...');
                        loginParams.suppressUpdateTimestamp = true;
                        login(loginParams).then(function (authResponse) {
                            console.log('POLYMER: access_token successfully refreshed.');
                            v._fireEvent(window, 'voyent-access-token-refreshed-vras', v.auth.getLastAccessToken());
                            resolve(authResponse);
                        }).catch(function (errorResponse) {
                            // Try and refresh the token once more after a small timeout
                            if (!isRetryAttempt) {
                                console.log('POLYMER: failed to refresh token, trying again', errorResponse);
                                setTimeout(function() {
                                    v.auth.refreshAccessToken(true).then(function (response) {
                                        resolve(response);
                                    }).catch(function(e) {});
                                },2000);
                            }
                            else {
                                console.log('POLYMER: firing `voyent-access-token-refresh-failed-vras` because we failed to refresh token on retry', errorResponse);
                                v._fireEvent(window, 'voyent-access-token-refresh-failed-vras', {});
                                reject(errorResponse);
                            }
                        });
                    }
                }

            });
        },
        
        getLoginParams: function() {
            var loginParams = v.auth.getConnectSettings();
            if (!loginParams) {
                return null;
            }
            
            loginParams.account = atob(utils.getSessionStorageItem(btoa(keys.ACCOUNT_KEY)));
            loginParams.realm = atob(utils.getSessionStorageItem(btoa(keys.REALM_KEY)));
            loginParams.host = atob(utils.getSessionStorageItem(btoa(keys.HOST_KEY)));
            loginParams.username = atob(utils.getSessionStorageItem(btoa(keys.USERNAME_KEY)));
            loginParams.password = atob(utils.getSessionStorageItem(btoa(authKeys.PASSWORD_KEY)));
            loginParams.admin = atob(utils.getSessionStorageItem(btoa(keys.ADMIN_KEY)));
            return loginParams;
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
            var connectTimeoutCb = utils.getSessionStorageItem(btoa(authKeys.RELOGIN_CB_KEY));
            if (connectTimeoutCb) {
                clearTimeout(connectTimeoutCb);
            }
            utils.removeSessionStorageItem(btoa(authKeys.RELOGIN_CB_KEY));
            var compSleepIntervalCb = utils.getSessionStorageItem(btoa(authKeys.COMPUTER_SLEEP_CB_KEY));
            if (compSleepIntervalCb) {
                clearInterval(compSleepIntervalCb);
            }
            utils.removeSessionStorageItem(btoa(authKeys.COMPUTER_SLEEP_CB_KEY));
            console.log('POLYMER:', new Date().toISOString() + ' voyent has disconnected');
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
            
            var result = token && tokenExpiresIn && tokenSetAt && (new Date().getTime() < (tokenExpiresIn + tokenSetAt) ) && (utils.isNode || (!utils.isNode && (isDev || currentPath.indexOf(scopeToPath) === 0)));
            //console.log('POLYMER:', 'v.auth.isLoggedIn=' + result + ': token=' + token + ' tokenExpiresIn=' + tokenExpiresIn + 'tokenSetAt=' + tokenSetAt + ' (new Date().getTime() < (tokenExpiresIn + tokenSetAt))=' + (new Date().getTime() < (tokenExpiresIn + tokenSetAt)) + ' (currentPath.indexOf(scopeToPath) === 0)=' + (currentPath.indexOf(scopeToPath) === 0));
            return !!result;
        },

        getLastKnownAccount: function () {
            var accountCipher = utils.getSessionStorageItem(btoa(keys.ACCOUNT_KEY));
            if (accountCipher) {
                return utils.sanitizeAccountName(atob(accountCipher));
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
                        'quickuser', token);

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
         * @param {String} params.role The single role to check for
         * @returns Promise
         */
        checkUserRole: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var role = validateAndReturnRequiredRole(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'rolecheck/', token, {roleName: role});

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
                    'users/' + username + '/rolecheck', token);

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
         * Update the last active timestamp for the session and resets the inactivity timer.
         * @memberOf voyent.auth
         * @alias updateLastActiveTimestamp
         */
        updateLastActiveTimestamp: function () {
            utils.setSessionStorageItem(btoa(authKeys.LAST_ACTIVE_TS_KEY), new Date().getTime());
            v.auth.resetInactiveSessionTimer();
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

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var username = utils.validateAndReturnRequiredUsername(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/' + account + '/';

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

    // Listeners to update the last active time stamp.
    window.onclick = voyentAuth.updateLastActiveTimestamp;
    window.onkeypress = voyentAuth.updateLastActiveTimestamp;

    return voyentAuth;
}
