import * as keys from 'keys'
import { getLastAccessToken, getLastKnownRealm, getLastKnownAccount, getLastKnownUsername } from 'auth-service'

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
    } else {
        realm = getLastKnownRealm();
    }
    if (realm) {
        if (!params.nostore) {
            setSessionStorageItem(btoa(keys.REALM_KEY), btoa(realm));
        }
        return realm;
    } else {
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
    } else {
        account = getLastKnownAccount();
    }
    if (account) {
        if (!params.nostore) {
            setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(account));
        }
        return account;
    } else {
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
    } else {
        return reject(Error('The Voyent username is required'));
    }
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


//local storage container that will be used to store data in node
//that is normally stored in the browser session or local storage
const nodeStorage = {};

export const isNode = typeof module === "object" &&
    typeof exports === "object" &&
    module.exports === exports &&
    typeof global === 'object';

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
        } else {
            window.Voyent_useLocalStorage = false;
        }

    }
    return window.Voyent_useLocalStorage;
}

function getCookie(cname) {
    const name = cname + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}

function setCookie(cname, cvalue, days) {
    const d = new Date();
    d.setTime(d.getTime() + ((days || 1) * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function removeCookie(cname) {
    setCookie(cname, null, -1);
}

function getNodeStorageItem(key) {
    return typeof nodeStorage[key] !== 'undefined' ? nodeStorage[key] : null;
}

function setNodeStorageItem(key, value) {
    nodeStorage[key] = value;
}

function removeNodeStorageItem(key) {
    delete nodeStorage[key];
}

export function getLocalStorageItem(key) {
    if (!isNode) {
        return useLocalStorage() ? window.localStorage.getItem(key) : getCookie(key);
    } else {
        return getNodeStorageItem(key);
    }
}

export function getSessionStorageItem(key) {
    if (!isNode) {
        return useLocalStorage() ? window.sessionStorage.getItem(key) : getCookie(key);
    } else {
        return getNodeStorageItem(key);
    }
}

export function setLocalStorageItem(key, value) {
    if (!isNode) {
        return useLocalStorage() ? window.localStorage.setItem(key, value) : setCookie(key, value);
    } else {
        return setNodeStorageItem(key, value);
    }
}

export function removeSessionStorageItem(key) {
    if (!isNode) {
        if (useLocalStorage()) {
            window.sessionStorage.removeItem(key);
        } else {
            removeCookie(key);
        }
    } else {
        removeNodeStorageItem(key);
    }
}

export function removeLocalStorageItem(key) {
    if (!isNode) {
        if (useLocalStorage()) {
            window.localStorage.removeItem(key);
        } else {
            removeCookie(key);
        }
    } else {
        removeNodeStorageItem(key);
    }
}

export function setSessionStorageItem(key, value) {
    if (!isNode) {
        return useLocalStorage() ? window.sessionStorage.setItem(key, value) : setCookie(key, value, 1);
    } else {
        return setNodeStorageItem(key, value);
    }
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

export function getFunctionName(fn) {
    let ret = fn.toString();
    ret = ret.substr('function '.length);
    ret = ret.substr(0, ret.indexOf('('));
    return ret;
}

export function findFunctionInGlobalScope(fn) {
    if (!fn) {
        return null;
    }
    let functionName;
    if (typeof fn === "string") {
        functionName = fn;
        const parts = functionName.split(".");
        let theObject = window;
        for (let i = 0; i < parts.length; i++) {
            theObject = theObject[parts[i]];
            if (!theObject) {
                return null;
            }
        }
        if (window == theObject) {
            return null;
        }
        return theObject;
    }
    else if (typeof fn === "function") {
        return fn;
    }
}