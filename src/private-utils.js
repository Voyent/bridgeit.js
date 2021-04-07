import * as keys from './keys'
import { getLastAccessToken, getLastKnownRealm, getLastKnownAccount, getLastKnownUsername } from './auth-service'

// Used as backup storage when local/session storage and cookies are not available
const localVariables = { };

// VRAS-1506
let appCredentials = { };

//redefine function to avoid circular dependency with public-utils
function getLastTransactionId() {
    return getSessionStorageItem(btoa(keys.TRANSACTION_KEY));
}

export function validateRequiredRealm(params, reject) {
    validateParameter('realm', 'The Voyent realm is required', params, reject);
}

export function validateAndReturnRequiredAccessToken(params, reject) {
    const token = params.accessToken || getLastAccessToken();
    if (token) {
        return token;
    }
    else {
        return reject(Error('A Voyent access token is required'));
    }
}

export function validateAndReturnRequiredRealmName(params, reject) {
    let realm = params.realmName;
    if (realm) {
        realm = encodeURI(realm);
    }
    else {
        realm = getLastKnownRealm();
    }
    if (realm) {
        if (!params.nostore) {
            setSessionStorageItem(btoa(keys.REALM_KEY), btoa(realm));
        }
        return realm;
    }
    else {
        return reject(Error('The Voyent realm is required'));
    }
}

export function validateAndReturnRequiredRealm(params, reject) {
    let realm = params.realm;
    if (realm) {
        realm = encodeURI(realm);
    }
    else {
        realm = getLastKnownRealm();
    }
    if (realm) {
        if (!params.nostore) {
            setSessionStorageItem(btoa(keys.REALM_KEY), btoa(realm));
        }
        return realm;
    }
    else {
        return reject(Error('The Voyent realm is required'));
    }
}

export function validateAndReturnRequiredAccount(params, reject) {
    let account = params.account;
    if (account) {
        account = encodeURI(account);
    }
    else {
        account = getLastKnownAccount();
    }
    if (account) {
        if (!params.nostore) {
            setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(account));
        }
        return account;
    }
    else {
        return reject(Error('The Voyent account is required'));
    }
}

export function validateAndReturnRequiredUsername(params, reject) {
    let username = params.username;
    if (!username) {
        username = getLastKnownUsername();
    }
    if (username) {
        if (!params.nostore) {
            setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(username));
        }
        return username;
    }
    else {
        return reject(Error('The Voyent username is required'));
    }
}

export function validateAndReturnRequiredUser(params, reject) {
    if (!params.user || typeof params.user !== 'object') {
        return reject(Error('The user parameter is required'));
    }
    return params.user;
}

export function validateRequiredUsername(params, reject) {
    validateParameter('username', 'The username parameter is required', params, reject);
}

export function validateRequiredPassword(params, reject) {
    validateParameter('password', 'The password parameter is required', params, reject);
}

export function validateRequiredId(params, reject) {
    validateParameter('id', 'The id is required', params, reject);
}

export function validateParameter(name, msg, params, reject) {
    if (!params[name]) {
        reject(Error(msg));
    }
}

function useLocalStorage() {
    if (!('Voyent_useLocalStorage' in window)) {
        if ('localStorage' in window) {
            try {
                const testdate = new Date().toString();
                window.localStorage.setItem('testdate', testdate);
                window.Voyent_useLocalStorage = window.localStorage.getItem('testdate') === testdate;
                window.localStorage.removeItem('testdate');
            } catch (e) {
                window.Voyent_useLocalStorage = false;
            }
        }
        else {
            window.Voyent_useLocalStorage = false;
        }
    }
    return window.Voyent_useLocalStorage;
}

function useCookies() {
    if (!('Voyent_useCookies' in window)) {
        try {
            document.cookie = 'cookietest=1';
            window.Voyent_useCookies = document.cookie.indexOf('cookietest=') !== -1;
            document.cookie = 'cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT';
        }
        catch (e) {
            window.Voyent_useCookies = false;
        }
        return window.Voyent_useCookies;
    }
    return window.Voyent_useCookies;
}

export function getLocalStorageItem(key) {
    return useLocalStorage()
        ? window.localStorage.getItem(key)
        : useCookies()
            ? getCookie(key)
            : getLocalVariable(key);
}

export function getSessionStorageItem(key) {
    return useLocalStorage()
        ? window.sessionStorage.getItem(key)
        : useCookies()
            ? getCookie(key)
            : getLocalVariable(key);
}

function getCookie(cname) {
    const name = cname + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1);
        if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
    }
    return "";
}

function getLocalVariable(key) {
    return localVariables[key];
}

export function setLocalStorageItem(key, value) {
    if (useLocalStorage()) {
        window.localStorage.setItem(key, value);
    }
    else if (useCookies()) {
        setCookie(key, value);
    }
    else {
        setLocalVariable(key, value);
    }
}

export function setSessionStorageItem(key, value) {
    if (useLocalStorage()) {
        window.sessionStorage.setItem(key, value)
    }
    else if (useCookies()) {
        setCookie(key, value, 1);
    }
    else {
        setLocalVariable(key, value);
    }
}

function setCookie(cname, cvalue, days) {
    const d = new Date();
    d.setTime(d.getTime() + ((days || 1) * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function setLocalVariable(key, value) {
    localVariables[key] = value;
}

export function removeLocalStorageItem(key) {
    if (useLocalStorage()) {
        window.localStorage.removeItem(key);
    }
    else if (useCookies()) {
        removeCookie(key);
    }
    else {
        removeLocalVariable(key);
    }
}

export function removeSessionStorageItem(key) {
    if (useLocalStorage()) {
        window.sessionStorage.removeItem(key);
    }
    else if (useCookies()) {
        removeCookie(key);
    }
    else {
        removeLocalVariable(key);
    }
}

function removeCookie(cname) {
    setCookie(cname, null, -1);
}

function removeLocalVariable(key) {
    delete localVariables[key];
}

export function getAppCredential(credential) {
    return appCredentials[credential];
}

export function setAppCredentials(credentials) {
    if (credentials && typeof credentials === 'object') {
        appCredentials = credentials;
        if (appCredentials.token) {
            appCredentials.tokenSetAt = new Date().getTime();
            // Default to 1 hour if a `tokenExpiresIn` value is not provided.
            if (!appCredentials.tokenExpiresIn) {
                appCredentials.tokenExpiresIn = 3600000;
            }
        }
    }
}

export function isValidString(str) {
    return !!(str && typeof str === 'string' && str.trim().length > 0);
}

export function isFunction(func) {
    return !!(func && typeof func === 'string');
}

export function sanitizeAccountName(original) {
    if (original) {
        return original.split(' ').join('_').replace(/[\\\/\.\"]/g, '').substring(0, 63).toLowerCase();
    }
    return original;
}

export function getTransactionURLParam() {
    const txId = getLastTransactionId();
    return txId ? 'tx=' + txId : '';
}

export function getRealmResourceURL(servicePath, account, realm, resourcePath, token, params) {
    const txParam = getTransactionURLParam();
    let url = servicePath +
        '/' + account + '/realms/' + realm + '/' + resourcePath + '?' +
        (token ? 'access_token=' + token : '') +
        (txParam ? '&' + txParam : '');
    if (params) {
        for (let key in params) {
            let param = params[key];
            if (typeof param === 'object') {
                try {
                    param = JSON.stringify(param);
                }
                catch (e) {
                    param = params[key];
                }
            }
            url += ('&' + key + '=' + param);
        }
    }
    return url;
}

export function extractResponseValues(xhr) {
    return {
        status: xhr.status,
        statusText: xhr.statusText,
        response: xhr.response,
        responseText: xhr.responseText,
        responseType: xhr.responseType,
        responseXML: xhr.responseXML
    }
}

export function fireEvent(el, eventName, detail) {
    let event;
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

/**
 * A more accurate timer utility than Javascript's built-in `setTimeout` and `setInterval`.
 * This timer loops `setTimeout` executions at the passed timeInterval but after the first
 * execution it adjusts each execution time based on the expected time using Date.now().
 * @param timeInterval
 * @param callback
 * @param errorCallback
 * @constructor
 */
export function Timer(timeInterval, callback, errorCallback) {
    let expected, timeout;
    /**
     * Start executing the timer. Triggered automatically on instance creation
     * but may be triggered to restart the timer if `stop` is triggered.
     */
    this.start = function() {
        // Set the expected execution time of the timer.
        expected = Date.now() + timeInterval;
        // Create the timeout.
        timeout = setTimeout(run.bind(this), timeInterval);
    };
    /**
     * Stop executing the timer. May be called on the timer instance.
     */
    this.stop = function() {
        // Clear the timeout.
        clearTimeout(timeout);
        timeout = 0;
    };
    /**
     * Handles running the callback continuously and adjusting
     * each execution to be at the expected time.
     */
    let run = function() {
        // How many `ms` the timeout execution was off by.
        let timeDrift = Date.now() - expected;
        // If the timer missed a full execution
        // then trigger the error callback.
        if (timeDrift > timeInterval) {
            if (errorCallback) {
                errorCallback();
            }
        }
        // Trigger the callback if provided.
        if (callback) {
            callback();
        }
        // Increment the expected execution time of the timer.
        expected += timeInterval;
        // Run the timer at the adjusted interval.
        timeout = setTimeout(run.bind(this), timeInterval - timeDrift);
    };
    // Start the timer immediately.
    this.start();
}