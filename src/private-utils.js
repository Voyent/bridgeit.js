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
            if (!params.nostore) {
                setSessionStorageItem(btoa(keys.REALM_KEY), btoa(realm));
            }
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
            if (!params.nostore) {
                setSessionStorageItem(btoa(keys.REALM_KEY), btoa(realm));
            }
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
            if (!params.nostore) {
                setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(sanitizeAccountName(account)));
            }
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
            if (!params.nostore) {
                setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(username));
            }
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
    
    function sanitizeAccountName(original) {
        if (original) {
            return original.split(' ').join('_').replace(/[\\\/\.\"]/g, '').substring(0, 63).toLowerCase();
        }
        return original;
    }

    function isFunction(func) {
        return !!(func && typeof func === 'string');
    }

    function getTransactionURLParam() {
        var txId = services.getLastTransactionId();
        return txId ? 'tx=' + txId : '';
    }

    function getRealmResourceURL(servicePath, account, realm, resourcePath, token, params) {
        var txParam = getTransactionURLParam();
        var url = servicePath +
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

    /**
     * A more accurate timer utility than Javascript's built-in `setTimeout` and `setInterval`.
     * This timer loops `setTimeout` executions at the passed timeInterval but after the first
     * execution it adjusts each execution time based on the expected time using Date.now().
     * execution
     * @param timeInterval
     * @param callback
     * @param errorCallback
     * @constructor
     */
    function Timer(timeInterval, callback, errorCallback) {
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

    return {
        'isNode': isNode,
        'getLocalStorageItem': getLocalStorageItem,
        'setLocalStorageItem': setLocalStorageItem,
        'removeLocalStorageItem': removeLocalStorageItem,
        'getSessionStorageItem': getSessionStorageItem,
        'setSessionStorageItem': setSessionStorageItem,
        'removeSessionStorageItem': removeSessionStorageItem,
        'sanitizeAccountName': sanitizeAccountName,
        'isFunction': isFunction,
        'getTransactionURLParam': getTransactionURLParam,
        'getRealmResourceURL': getRealmResourceURL,
        'extractResponseValues': extractResponseValues,
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
        'Timer': Timer
    }
}