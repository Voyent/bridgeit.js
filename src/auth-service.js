import * as keys from './keys'
import * as utils from './private-utils'
import { authURL, authAdminURL, baseURL, post, getJSON } from './public-utils'
import { fireEvent } from './private-utils'

const authKeys = {
    PASSWORD_KEY: 'voyentPassword',
    CONNECT_SETTINGS_KEY: 'voyentConnectSettings',
    RELOGIN_CB_KEY: 'voyentReloginCallback',
    LAST_ACTIVE_TS_KEY: 'voyentLastActiveTimestamp',
    COMPUTER_SLEEP_CB_KEY: 'voyentComputerSleepCallback',
};

function validateAndReturnRequiredRole(params, reject){
    const role = params.role;
    if( role ){
        return role;
    }
    else{
        return reject(Error('The Voyent role parameter is required'));
    }
}

function validateAndReturnRequiredRoles(params, reject){
    const roles = params.roles;
    if( roles ){
        return roles;
    }
    else{
        return reject(Error('The Voyent roles parameter is required'));
    }
}

let connected = false;

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
export function getNewAccessToken(params) {
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
            const url = authURL + '/' + encodeURI(params.account) +
                '/realms/' + encodeURI(params.realm) + '/token/?' + utils.getTransactionURLParam();

            post(url, {
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
}

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
 * @returns {Promise} with the following argument:
 *      {
 *          access_token: 'xxx',
 *          expires_in: 99999
 *      }
 *
 */
export function login(params) {
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
        const txParam = utils.getTransactionURLParam();
        const url = authURL + '/' + encodeURI(params.account) +
            '/realms/' + (params.admin === 'true' ? 'admin' : encodeURI(params.realm)) + '/token/' + (txParam ? ('?' + txParam) : '');

        const loggedInAt = new Date().getTime();
        post(url, {
            strategy: 'query',
            username: params.username,
            password: params.password
        }).then(function (authResponse) {
            if (!params.suppressUpdateTimestamp) {
                updateLastActiveTimestamp();
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
            if (params.admin) {
                utils.setSessionStorageItem(btoa(keys.ADMIN_KEY), btoa(params.admin));
            }
            else {
                utils.removeSessionStorageItem(btoa(keys.ADMIN_KEY));
            }
            fireEvent(window, 'voyent-login-succeeded', {});
            resolve(authResponse);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

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
export function storeLogin(params) {
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
    
        updateLastActiveTimestamp();
        utils.setSessionStorageItem(btoa(keys.TOKEN_KEY), params.access_token);
        utils.setSessionStorageItem(btoa(keys.TOKEN_EXPIRES_KEY), params.expires_in);
        utils.setSessionStorageItem(btoa(keys.TOKEN_SET_KEY), new Date().getTime());
        utils.setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(utils.sanitizeAccountName(params.account)));
        utils.setSessionStorageItem(btoa(keys.REALM_KEY), btoa(params.realm));
        utils.setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(params.username));
        
        resolve();
    });
}

/**
 * Stores the passed credentials in memory. These will be used first
 * when calling `getLast*` functions. Quick and unfortunate fix for VRAS-1506.
 * @param credentials
 */
export function storeAppCredentials(credentials) {
    utils.setAppCredentials(credentials);
}

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
 * @param {Boolean} params.storeCredentials (default true) Whether to store encrypted credentials in session
 *     storage. If set to false, voyent will not attempt to relogin before the session expires.
 * @param {Function} params.onSessionExpiry Function callback to be called on session expiry. If you wish to
 *     ensure that disconnect is not called until after your onSessionExpiry callback has completed, please
 *     return a Promise from your function.
 * @returns Promise with service definitions
 *
 */
export function connect(params) {
    return new Promise(function (resolve, reject) {

        function startTokenExpiryTimer(timeout) {
            const tokenSetAt = new Date();
            tokenSetAt.setTime(getTokenSetAtTime());

            const connectTimeoutCb = setTimeout(connectCallback, timeout);
            utils.setSessionStorageItem(btoa(authKeys.RELOGIN_CB_KEY), connectTimeoutCb);

            console.log(new Date().toISOString() + ' voyent.auth.connect: setting next connection check to ' + timeout / 1000 / 60 + ' mins, expiresIn: ' +
                (getExpiresIn() / 1000 / 60) + ' mins, remaining: ' +
                (getTimeRemainingBeforeExpiry() / 1000 / 60) + ' mins, token set at ' + tokenSetAt);

            // When the computer is put to sleep our timer for the access_token refresh is no longer valid
            // since it will pause during sleep and then continue execution from where it left off once awake.
            // We will try and detect if the computer has been sleeping by using a continuously running
            // setInterval. If it takes longer than expected for the setInterval to execute then we will assume
            // that the computer has been sleeping and try to refresh the token.

            // First check if we already have a sleep timer running and if so clear it
            const compSleepIntervalCb = utils.getSessionStorageItem(btoa(authKeys.COMPUTER_SLEEP_CB_KEY));
            if (compSleepIntervalCb) {
                clearInterval(compSleepIntervalCb);
            }
            const sleepTimeout = 10000; // Run the sleep timer every 10 seconds so it will detect sleep shortly after awakening
            let lastCheckedTime = (new Date()).getTime();
            const computerSleepTimer = setInterval(function () {
                const currentTime = (new Date()).getTime();
                // Set a 60 second buffer for the timeout as setInterval does not guarantee exact timing (VRAS-1710).
                const timerPadding = 60000;
                const nextExpectedTime = lastCheckedTime + sleepTimeout + timerPadding;
                if (currentTime > (nextExpectedTime)) {
                    console.log('VRAS_MITHRIL: triggering refreshAccessToken from sleepTimer', currentTime - nextExpectedTime);
                    // Clear the old token timer since it is not valid after computer sleep
                    const oldConnectTimeoutCb = utils.getSessionStorageItem(btoa(authKeys.RELOGIN_CB_KEY), connectTimeoutCb);
                    if (oldConnectTimeoutCb) {
                        clearTimeout(oldConnectTimeoutCb);
                        utils.removeSessionStorageItem(btoa(authKeys.RELOGIN_CB_KEY));
                    }
                    // Try and refresh the token
                    refreshAccessToken().then(function () {
                        startTokenExpiryTimer(getExpiresIn() - timeoutPadding);
                    }).catch(function () {});
                }
                lastCheckedTime = currentTime;
            }, sleepTimeout);
            utils.setSessionStorageItem(btoa(authKeys.COMPUTER_SLEEP_CB_KEY), computerSleepTimer);
        }

        /* The function callback set to run before the next timeout,
         will automatically reset the next setTimeout call if necessary */
        function connectCallback() {
            console.log(new Date().toISOString() + ' voyent.auth.connect: callback running');
            let connectSettings = getConnectSettings();
            if (!connectSettings) {
                console.log(new Date().toISOString() + ' voyent.auth.connect: error, could not retrieve settings');
                return;
            }

            const timeoutMillis = connectSettings.connectionTimeout * 60 * 1000;

            //first check if connectionTimeout has expired
            const now = new Date().getTime();
            const inactiveMillis = now - getLastActiveTimestamp();
            const millisUntilTimeoutExpires = timeoutMillis - inactiveMillis;
            console.log('voyent.auth.connect: getLastActiveTimestamp: ' + getLastActiveTimestamp());
            console.log('voyent.auth.connect: connection timeout ms: ' + timeoutMillis);
            console.log('voyent.auth.connect: current timestamp: ' + now);
            console.log('voyent.auth.connect: inactive ms: ' + inactiveMillis + '(' + (inactiveMillis / 1000 / 60) + ' mins)');
            console.log('voyent.auth.connect: ms until timeout: ' + millisUntilTimeoutExpires + '(' + (millisUntilTimeoutExpires / 1000 / 60) + ' mins)');

            //if we haven't exceeded the connection timeout, reconnect
            if (millisUntilTimeoutExpires > 0) {
                console.log(new Date().toISOString() + ' voyent.auth.connect: timeout has not been exceeded, ' +
                    getTimeRemainingBeforeExpiry() / 1000 / 60 + ' mins remaining before token expires, ' +
                    millisUntilTimeoutExpires / 1000 / 60 + ' mins remaining before timeout expires');

                //if we the time remaining before expiry is less than the session timeout
                //refresh the access token and set the timeout
                if (timeoutMillis > millisUntilTimeoutExpires) {
                    console.log('VRAS_MITHRIL: triggering refreshAccessToken from connectCallback', timeoutMillis - millisUntilTimeoutExpires);
                    refreshAccessToken().then(function () {
                        startTokenExpiryTimer(getExpiresIn() - timeoutPadding);
                    }).catch(function() {});
                }
            } else {
                console.log(new Date().toISOString() + ' voyent.auth.connect: timeout has expired, disconnecting..');

                //look for the onSessionExpiry callback on the params first,
                //as functions could be passed by reference
                //secondly by settings, which would only be passed by name
                let expiredCallback = params.onSessionExpiry;
                if (!expiredCallback) {
                    expiredCallback = connectSettings.onSessionExpiry;
                }

                //if there's no onSessionExpiry, call disconnect immediately
                //otherwise search for onSessionExpiry function, if not found
                //call disconnect() immediately, otherwise call onSessionExpiry
                //if callback if a promise, wait until the promise completes
                //before disconnecting, otherwise, wait 500ms then disconnect
                if (expiredCallback) {
                    let expiredCallbackFunction;
                    if (typeof expiredCallback === 'function') {
                        expiredCallbackFunction = expiredCallback;
                    }
                    else if (typeof expiredCallback === 'string') {
                        expiredCallbackFunction = utils.findFunctionInGlobalScope(expiredCallback);
                    }
                    if (expiredCallbackFunction) {
                        const expiredCallbackPromise = expiredCallbackFunction();
                        if (expiredCallbackPromise && expiredCallbackPromise.then) {
                            expiredCallbackPromise.then(disconnect)
                                ['catch'](disconnect);
                        }
                        else {
                            setTimeout(disconnect, 500);
                        }
                    }
                    else {
                        console.log(new Date().toISOString() + ' voyent.auth.connect: error calling onSessionExpiry callback, ' +
                            'could not find function: ' + expiredCallback);
                        disconnect();
                    }

                }
                else {
                    disconnect();
                }

            }
        }

        /* initialize the timing for the callback check */
        function initConnectCallback() {

            //if the desired connection timeout is greater the token expiry
            //set the callback check for just before the token expires
            let callbackTimeout;
            if (connectionTimeoutMillis > getTimeRemainingBeforeExpiry()) {
                callbackTimeout = getTimeRemainingBeforeExpiry() - timeoutPadding;
            }
            //otherwise the disired timeout is less then the token expiry
            //so set the callback to happen just at specified timeout
            else {
                callbackTimeout = connectionTimeoutMillis;
            }

            startTokenExpiryTimer(callbackTimeout);

            if (settings.usePushService) {
                //startPushService(settings);
            }
            connected = true;
        }

        /* initialize basic settings */
        function initSettings() {

            params = params ? params : {};
            if (!params.storeCredentials) {
                params.storeCredentials = true;
            }

            //store connect settings
            settings = {
                host: baseURL,
                usePushService: params.usePushService,
                connectionTimeout: params.connectionTimeout || 20,
                ssl: params.ssl,
                storeCredentials: params.storeCredentials || true,
                onSessionExpiry: params.onSessionExpiry,
            };
            if (params.admin) {
                settings.admin = params.admin;
            }

            //settings.connectionTimeout = 5;

            utils.setSessionStorageItem(btoa(authKeys.CONNECT_SETTINGS_KEY), btoa(JSON.stringify(settings)));

            if (params.onSessionExpiry) {
                if (typeof params.onSessionExpiry === 'function') {
                    const name = utils.getFunctionName(params.onSessionExpiry);
                    if (name) {
                        settings.onSessionExpiry = name;
                    }
                }
            }


            connectionTimeoutMillis = (settings.connectionTimeout) * 60 * 1000;

        }

        /* store the provided credentials */
        function saveCredentials() {
            utils.setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(getLastKnownAccount()));
            utils.setSessionStorageItem(btoa(keys.REALM_KEY), btoa(getLastKnownRealm()));
            utils.setSessionStorageItem(btoa(keys.HOST_KEY), btoa(getLastKnownHost()));
            utils.setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(params.username));
            utils.setSessionStorageItem(btoa(authKeys.PASSWORD_KEY), btoa(params.password));
        }

        let timeoutPadding = 60000;
        let settings;
        let connectionTimeoutMillis;
        initSettings();

        if (isLoggedIn()) {
            initConnectCallback();
            resolve();
        }
        else {
            login(params).then(function (authResponse) {
                console.log(new Date().toISOString() + ' voyent.auth.connect: received auth response');
                // Set the username from the response so we have the exact username with proper letter casing.
                if (authResponse.username) {
                    params.username = authResponse.username;
                }
                saveCredentials();
                initConnectCallback();
                resolve(authResponse);
            })['catch'](function (error) {
                reject(error);
            });
        }
    });
}

export function refreshAccessToken(isRetryAttempt) {
    console.log('VRAS_MITHRIL: refreshAccessToken triggered');
    return new Promise(function (resolve, reject) {
        if (!isLoggedIn()) {
            console.log('VRAS_MITHRIL: firing `voyent-access-token-refresh-failed` because user is not logged in');
            fireEvent(window, 'voyent-access-token-refresh-failed', {});
            reject('voyent.auth.refreshAccessToken() not logged in, cant refresh token');
        }
        else {
            let loginParams = getLoginParams();
            if (!loginParams) {
                console.log('VRAS_MITHRIL: firing `voyent-access-token-refresh-failed` because there are no `loginParams`', loginParams);
                fireEvent(window, 'voyent-access-token-refresh-failed', {});
                reject('voyent.auth.refreshAccessToken() no connect settings, cant refresh token');
            }
            else {
                console.log('VRAS_MITHRIL: refreshing access_token');
                loginParams.suppressUpdateTimestamp = true;
                login(loginParams).then(function (authResponse) {
                    console.log('VRAS_MITHRIL: access_token successfully refreshed');
                    fireEvent(window, 'voyent-access-token-refreshed', getLastAccessToken());
                    if (loginParams.usePushService) {
                        //startPushService(loginParams);
                    }
                    resolve(authResponse);
                }).catch(function (errorResponse) {
                    // Try and refresh the token once more after a small timeout
                    if (!isRetryAttempt) {
                        console.log('VRAS_MITHRIL: failed to refresh token, trying again', errorResponse);
                        setTimeout(function() {
                            refreshAccessToken(true).then(function (response) {
                                resolve(response);
                            }).catch(function(e) {});
                        },2000);
                    }
                    else {
                        console.log('VRAS_MITHRIL: firing `voyent-access-token-refresh-failed` because we failed to refresh token on retry', errorResponse);
                        fireEvent(window, 'voyent-access-token-refresh-failed', {});
                        reject(errorResponse);
                    }
                });
            }
        }

    });
}

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
export function disconnect() {
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
    const connectTimeoutCb = utils.getSessionStorageItem(btoa(authKeys.RELOGIN_CB_KEY));
    if (connectTimeoutCb) {
        clearTimeout(connectTimeoutCb);
    }
    utils.removeSessionStorageItem(btoa(authKeys.RELOGIN_CB_KEY));
    const compSleepIntervalCb = utils.getSessionStorageItem(btoa(authKeys.COMPUTER_SLEEP_CB_KEY));
    if (compSleepIntervalCb) {
        clearInterval(compSleepIntervalCb);
    }
    utils.removeSessionStorageItem(btoa(authKeys.COMPUTER_SLEEP_CB_KEY));
    console.log(new Date().toISOString() + ' voyent has disconnected');
    connected = false;
}

export function getExpiresIn() {
    let tokenExpiresIn = utils.getAppCredential('tokenExpiresIn');
    if (tokenExpiresIn) {
        return tokenExpiresIn;
    }
    const expiresInStr = utils.getSessionStorageItem(btoa(keys.TOKEN_EXPIRES_KEY));
    if (expiresInStr) {
        return parseInt(expiresInStr, 10);
    }
}

export function getTokenSetAtTime() {
    let tokenSetAt = utils.getAppCredential('tokenSetAt');
    if (tokenSetAt) {
        return tokenSetAt;
    }
    const tokenSetAtStr = utils.getSessionStorageItem(btoa(keys.TOKEN_SET_KEY));
    if (tokenSetAtStr) {
        return parseInt(tokenSetAtStr, 10);
    }
}

export function getTimeRemainingBeforeExpiry() {
    const expiresIn = getExpiresIn();
    const token = getLastAccessToken();
    if (expiresIn && token) {
        const now = new Date().getTime();
        return (getTokenSetAtTime() + expiresIn) - now;
    }
}

export function getLoginParams() {
    const loginParams = getConnectSettings();
    if (!loginParams) {
        console.log('VRAS_MITHRIL: getLoginParams1 found', loginParams);
        return null;
    }
    
    loginParams.account = atob(utils.getSessionStorageItem(btoa(keys.ACCOUNT_KEY)));
    loginParams.realm = atob(utils.getSessionStorageItem(btoa(keys.REALM_KEY)));
    loginParams.host = atob(utils.getSessionStorageItem(btoa(keys.HOST_KEY)));
    loginParams.username = atob(utils.getSessionStorageItem(btoa(keys.USERNAME_KEY)));
    loginParams.password = atob(utils.getSessionStorageItem(btoa(authKeys.PASSWORD_KEY)));
    if (utils.getSessionStorageItem(btoa(keys.ADMIN_KEY))) {
        loginParams.admin = atob(utils.getSessionStorageItem(btoa(keys.ADMIN_KEY)));
    }

    console.log('VRAS_MITHRIL: getLoginParams2 found', loginParams);
    return loginParams;
}

export function getConnectSettings() {
    const settingsStr = utils.getSessionStorageItem(btoa(authKeys.CONNECT_SETTINGS_KEY));
    if (settingsStr) {
        return JSON.parse(atob(settingsStr));
    }
}

export function isLoggedIn() {
    const token = utils.getAppCredential('token') || utils.getSessionStorageItem(btoa(keys.TOKEN_KEY)),
        tokenExpiresInStr = utils.getAppCredential('tokenExpiresIn') || utils.getSessionStorageItem(btoa(keys.TOKEN_EXPIRES_KEY)),
        tokenExpiresIn = tokenExpiresInStr ? parseInt(tokenExpiresInStr, 10) : null,
        tokenSetAtStr = utils.getAppCredential('tokenSetAt') || utils.getSessionStorageItem(btoa(keys.TOKEN_SET_KEY)),
        tokenSetAt = tokenSetAtStr ? parseInt(tokenSetAtStr, 10) : null,
        currentMillis = new Date().getTime(),
        tokenExpiresAtMillis = tokenExpiresIn && tokenSetAt ? (tokenExpiresIn + tokenSetAt) : 0;
    console.log('VRAS_MITHRIL: isLoggedIn=' + !!(token && (currentMillis < tokenExpiresAtMillis)) + ': token=' + token + ' currentMillis=' + currentMillis + 'tokenExpiresAtMillis=' + tokenExpiresAtMillis + 'currentMillis-tokenExpiresAtMillis=', currentMillis-tokenExpiresAtMillis);
    return !!(token && (currentMillis < tokenExpiresAtMillis));
}

export function getLastKnownAccount() {
    let account = utils.getAppCredential('account');
    if (utils.isValidString(account)) {
        return utils.sanitizeAccountName(account)
    }
    const accountCipher = utils.getSessionStorageItem(btoa(keys.ACCOUNT_KEY));
    if (accountCipher) {
        return utils.sanitizeAccountName(atob(accountCipher));
    }
}

export function getLastKnownRealm() {
    let realm = utils.getAppCredential('realm');
    if (utils.isValidString(realm)) {
        return realm;
    }
    const realmCipher = utils.getSessionStorageItem(btoa(keys.REALM_KEY));
    if (realmCipher) {
        return atob(realmCipher);
    }
}

export function getLastKnownUsername() {
    let username = utils.getAppCredential('username');
    if (utils.isValidString(username)) {
        return username;
    }
    const usernameCipher = utils.getSessionStorageItem(btoa(keys.USERNAME_KEY));
    if (usernameCipher) {
        return atob(usernameCipher);
    }
}

export function getLastKnownHost() {
    const hostCipher = utils.getSessionStorageItem(btoa(keys.HOST_KEY));
    if (hostCipher) {
        return atob(hostCipher);
    }
}

export function getLastAccessToken() {
    let token = utils.getAppCredential('token');
    if (utils.isValidString(token)) {
        return token;
    }
    return utils.getSessionStorageItem(btoa(keys.TOKEN_KEY));
}

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
export function registerAsNewUser(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            const account = utils.validateAndReturnRequiredAccount(params, reject);
            const realm = utils.validateAndReturnRequiredRealm(params, reject);
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);

            utils.validateRequiredUsername(params, reject);
            utils.validateRequiredPassword(params, reject);

            const user = {
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

            const url = utils.getRealmResourceURL(authAdminURL, account, realm,
                'quickuser', token);

            post(url, {user: user}).then(function (response) {
                updateLastActiveTimestamp();
                resolve(response);
            })['catch'](function (error) {
                reject(error);
            });
        }
    );
}

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
export function checkUserRole(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealm(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        const role = validateAndReturnRequiredRole(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'rolecheck/', token, {roleName: role});

        getJSON(url).then(function (response) {
            if (response.results) {
                updateLastActiveTimestamp();
                resolve(true);
            }
            else {
                reject(response);
            }
        })['catch'](function (response) {
            if (response.status == 403) {
                updateLastActiveTimestamp();
                resolve(false);
            }
            else {
                reject(response);
            }
        });
    });
}

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
export function checkUserRoles(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealm(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        const roles = validateAndReturnRequiredRoles(params, reject);
        const username = utils.validateAndReturnRequiredUsername(params, reject);

        const payload = {
            roleBlock: [{
                name: 'first',
                roles: roles,
                op: params.op
            }]
        };

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'users/' + username + '/rolecheck', token);

        post(url, payload).then(function (response) {
            updateLastActiveTimestamp();
            resolve(true);
        })['catch'](function (response) {
            if (response.status == 403) {
                updateLastActiveTimestamp();
                resolve(false);
            }
            else {
                reject(response);
            }
        });
    });
}


/**
 * Update the last active timestamp for Voyent auth. This value is used
 * when checking for clients-side session timeouts.
 * @memberOf voyent.auth
 * @alias updateLastActiveTimestamp
 */
export function updateLastActiveTimestamp() {
    utils.setSessionStorageItem(btoa(authKeys.LAST_ACTIVE_TS_KEY), new Date().getTime());
}

/**
 * Return the timestamp of the last voyent op or when voyent.auth.updateLastActiveTimestamp()
 * was called.
 * @memberOf voyent.auth
 * @alias getLastActiveTimestamp
 */
export function getLastActiveTimestamp() {
    return utils.getSessionStorageItem(btoa(authKeys.LAST_ACTIVE_TS_KEY));
}

export function forgotPassword(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const username = utils.validateAndReturnRequiredUsername(params, reject);

        const txParam = utils.getTransactionURLParam();
        let url = authAdminURL + '/' + account + '/';

        if (params.realm) {
            url += 'realms/' + params.realm + '/users/' + username + '/emailpassword';
        }
        else { //admin
            url += 'admins/' + username + '/emailpassword';
        }
        url += (txParam ? '?' + txParam : '');

        post(url).then(function (response) {
            updateLastActiveTimestamp();
            resolve(true);
        })['catch'](function (response) {
            reject(response);
        });
    });
}

/**
 * Return a generated password that matches the requirements of our service
 * Specifically: /^[A-Za-z0-9!@#%^&*_\s]*$/
 * This can be leveraged as part of anonymous user creation
 *
 * Credit goes to http://stackoverflow.co./12635919
 *
 * @returns String password
 */
export function generatePassword() {
    const specials = '!@#%^&*_';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const all = specials + lowercase + uppercase + numbers;

    String.prototype.pick = function (min, max) {
        let n, chars = '';

        if (typeof max === 'undefined') {
            n = min;
        } else {
            n = min + Math.floor(Math.random() * (max - min));
        }

        for (let i = 0; i < n; i++) {
            chars += this.charAt(Math.floor(Math.random() * this.length));
        }

        return chars;
    };

    String.prototype.shuffle = function () {
        const array = this.split('');
        let tmp, current, top = array.length;

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
