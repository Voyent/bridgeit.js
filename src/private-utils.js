function PrivateUtils(services, keys) {

    function validateRequiredRealm(params, reject) {
        validateParameter('realm', 'The Voyent realm is required', params, reject);
    }

    function validateAndReturnRequiredAccessToken(params, reject) {
        var token = params.accessToken || services.auth.getLastAccessToken();
        if (token) {
            return token;
        }
        else {
            return reject(Error('A Voyent access token is required'));
        }
    }

    function validateAndReturnRequiredRealmName(params, reject) {
        var realm = params.realmName;
        if (realm) {
            realm = encodeURI(realm);
        } else {
            realm = services.auth.getLastKnownRealm();
        }
        if (realm) {
            setSessionStorageItem(btoa(keys.REALM_KEY), btoa(realm));
            return realm;
        } else {
            return reject(Error('The Voyent realm is required'));
        }
    }

    function validateAndReturnRequiredRealm(params, reject) {
        var realm = params.realm;
        if (realm) {
            realm = encodeURI(realm);
        }
        else {
            realm = services.auth.getLastKnownRealm();
        }
        if (realm) {
            setSessionStorageItem(btoa(keys.REALM_KEY), btoa(realm));
            return realm;
        }
        else {
            return reject(Error('The Voyent realm is required'));
        }
    }

    function validateAndReturnRequiredAccount(params, reject) {
        var account = params.account;
        if (account) {
            account = encodeURI(account);
        } else {
            account = services.auth.getLastKnownAccount();
        }
        if (account) {
            setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(account));
            return account;
        } else {
            return reject(Error('The Voyent account is required'));
        }
    }

    function validateAndReturnRequiredUsername(params, reject) {
        var username = params.username;
        if (!username) {
            username = services.auth.getLastKnownUsername();
        }
        if (username) {
            setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(username));
            return username;
        } else {
            return reject(Error('The Voyent username is required'));
        }
    }

    function validateRequiredUsername(params, reject) {
        validateParameter('username', 'The username parameter is required', params, reject);
    }

    function validateRequiredPassword(params, reject) {
        validateParameter('password', 'The password parameter is required', params, reject);
    }

    function validateRequiredId(params, reject) {
        validateParameter('id', 'The id is required', params, reject);
    }

    function validateParameter(name, msg, params, reject) {
        if (!params[name]) {
            reject(Error(msg));
        }
    }


    //local storage container that will be used to store data in node
    //that is normally stored in the browser session or local storage
    var nodeStorage = {};

    var isNode = typeof module === "object" &&
        typeof exports === "object" &&
        module.exports === exports &&
        typeof global === 'object';

    function useLocalStorage() {
        if (!('Voyent_useLocalStorage' in window)) {
            if ('localStorage' in window) {
                try {
                    var testdate = new Date().toString();
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
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
        }
        return "";
    }

    function setCookie(cname, cvalue, days) {
        var d = new Date();
        d.setTime(d.getTime() + ((days || 1) * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
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

    function getLocalStorageItem(key) {
        if (!isNode) {
            return useLocalStorage() ? window.localStorage.getItem(key) : v.getCookie(key);
        } else {
            return getNodeStorageItem(key);
        }
    }

    function getSessionStorageItem(key) {
        if (!isNode) {
            return useLocalStorage() ? window.sessionStorage.getItem(key) : getCookie(key);
        } else {
            return getNodeStorageItem(key);
        }
    }

    function setLocalStorageItem(key, value) {
        if (!isNode) {
            return useLocalStorage() ? window.localStorage.setItem(key, value) : setCookie(key, value);
        } else {
            return setNodeStorageItem(key, value);
        }
    }

    function removeSessionStorageItem(key) {
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

    function removeLocalStorageItem(key) {
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

    function setSessionStorageItem(key, value) {
        if (!isNode) {
            return useLocalStorage() ? window.sessionStorage.setItem(key, value) : setCookie(key, value, 1);
        } else {
            return setNodeStorageItem(key, value);
        }
    }

    function getTransactionURLParam() {
        var txId = services.getLastTransactionId();
        return txId ? 'tx=' + txId : '';
    }

    function getRealmResourceURL(servicePath, account, realm, resourcePath, token, ssl, params) {
        var protocol = ssl ? 'https://' : 'http://';
        var txParam = getTransactionURLParam();
        var url = protocol + servicePath +
            '/' + account + '/realms/' + realm + '/' + resourcePath + '?' +
            (token ? 'access_token=' + token : '') +
            (txParam ? '&' + txParam : '');
        if (params) {
            for (var key in params) {
                var param = params[key];
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

    function extractResponseValues(xhr) {
        return {
            status: xhr.status,
            statusText: xhr.statusText,
            response: xhr.response,
            responseText: xhr.responseText,
            responseType: xhr.responseType,
            responseXML: xhr.responseXML
        }
    }

    function getFunctionName(fn) {
        var ret = fn.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret;
    }

    function findFunctionInGlobalScope(fn) {
        if (!fn) {
            return null;
        }
        var functionName;
        if (typeof fn === "string") {
            functionName = fn;
            var parts = functionName.split(".");
            var theObject = window;
            for (var i = 0; i < parts.length; i++) {
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

    function determineProtocol(ssl) {
        if (typeof ssl !== 'undefined' && ssl !== null) {
            return ssl ? 'https://' : 'http://';
        }
        return 'https:' == document.location.protocol ? 'https://' : 'http://';
    }

    return {
        'isNode': isNode,
        'getLocalStorageItem': getLocalStorageItem,
        'setLocalStorageItem': setLocalStorageItem,
        'removeLocalStorageItem': removeLocalStorageItem,
        'getSessionStorageItem': getSessionStorageItem,
        'setSessionStorageItem': setSessionStorageItem,
        'removeSessionStorageItem': removeSessionStorageItem,
        'getTransactionURLParam': getTransactionURLParam,
        'getRealmResourceURL': getRealmResourceURL,
        'extractResponseValues': extractResponseValues,
        'getFunctionName': getFunctionName,
        'findFunctionInGlobalScope': findFunctionInGlobalScope,
        'validateParameter': validateParameter,
        'validateRequiredUsername': validateRequiredUsername,
        'validateRequiredPassword': validateRequiredPassword,
        'validateAndReturnRequiredUsername': validateAndReturnRequiredUsername,
        'validateRequiredRealm': validateRequiredRealm,
        'validateAndReturnRequiredRealm': validateAndReturnRequiredRealm,
        'validateAndReturnRequiredRealmName': validateAndReturnRequiredRealmName,
        'validateAndReturnRequiredAccount': validateAndReturnRequiredAccount,
        'validateAndReturnRequiredAccessToken': validateAndReturnRequiredAccessToken,
        'validateRequiredId': validateRequiredId,
        'determineProtocol': determineProtocol
    }
}