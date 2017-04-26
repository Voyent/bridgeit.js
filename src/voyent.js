/* Voyent Mobile 1.0.7
 *
 * Copyright 2004-2013 ICEsoft Technologies Canada Corp.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the
 * License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
if (!window['ice']) {
    window.ice = {};
}
if (!window['voyent']) {
    window.voyent = {};
}
if (!window.console) {
    console = {};
    if (ice.logInContainer) {
        console.log = ice.logInContainer;
    } else {
        console.log = function () {
        };
        console.error = function () {
        };
    }
}
/**
 * The Voyent JavaScript API. Native Mobile integration for your web app.
 *
 * Voyent provides a variety of device commands that allow access to
 * device features from JavaScript, all while running in the stock browser
 * such as Safari or Chrome. This is made possible by the BridgeIt utility app
 * that runs alongside the browser and is available for each of the supported
 * platforms (currently Android, iOS, and Windows Phone 8).
 *
 * For example, voyent.camera('myCamera', 'myCallback') will allow the user
 * to take a photo identified by 'myCamera' and this will be returned via an
 * event to the function named myCallback.  For the best compatibility the
 * callback is passed by name since the browser page may be refreshed when
 * the callback returns. The callback will be passed an event where:
 *
 * event.response: HTTP response from the server if the command makes an HTTP POST
 * event.preview: data-uri containing any preview image resulting from the command
 * event.name: id specified in the command call
 * event.value: return value from the command
 *
 * Most device commands accept an options parameter object.  Options supported
 * by a variety of commands are: options.postURL (the URL used to upload
 * the result of the command), and extra parameters
 * specific to the command may be added to the options argument.
 *
 * @class voyent
 */
(function (v) {
    function useLocalStorage() {
        if (!('bridgeit_useLocalStorage' in window )) {
            if ('localStorage' in window) {
                try {
                    var testdate = new Date().toString();
                    localStorage.setItem('testdate', testdate);
                    if (localStorage.getItem('testdate') === testdate) {
                        window.bridgeit_useLocalStorage = true;
                    }
                    else {
                        window.bridgeit_useLocalStorage = false;
                    }
                    localStorage.removeItem('testdate');
                }
                catch (e) {
                    window.bridgeit_useLocalStorage = false;
                }
            }
            else {
                window.bridgeit_useLocalStorage = false;
            }

        }
        return window.bridgeit_useLocalStorage;
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

    function getLocalStorageItem(key) {
        return useLocalStorage() ? localStorage.getItem(key) : getCookie(key);
    }

    function getSessionStorageItem(key) {
        return useLocalStorage() ? sessionStorage.getItem(key) : getCookie(key);
    }

    function setLocalStorageItem(key, value) {
        return useLocalStorage() ? localStorage.setItem(key, value) : setCookie(key, value);
    }

    function removeSessionStorageItem(key) {
        if (useLocalStorage()) {
            sessionStorage.removeItem(key);
        } else {
            setCookie(key, null);
        }
    }

    function removeLocalStorageItem(key) {
        if (useLocalStorage()) {
            localStorage.removeItem(key);
        } else {
            setCookie(key, null);
        }
    }

    function setSessionStorageItem(key, value) {
        return useLocalStorage() ? sessionStorage.setItem(key, value) : setCookie(key, value, 1);
    }

    function getNamedObject(name) {
        if (!name) {
            return null;
        }
        var parts = name.split(".");
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

    var CLOUD_PUSH_KEY = "ice.notifyBack";

    v.getCloudPushId = function getCloudPushId() {
        return getLocalStorageItem(CLOUD_PUSH_KEY);
    };

    function setupCloudPush() {
        var cloudPushId = v.getCloudPushId();
        if (!!cloudPushId) {
            if (ice.push) {
                console.log("Cloud Push registered: " + cloudPushId);
                ice.push.parkInactivePushIds(cloudPushId);
            }
        }
    }

    //move pause and resume to ICEpush when ready
    function pausePush() {
        if (window.ice && ice.push) {
            ice.push.connection.pauseConnection();
        }
    }

    function resumePush() {
        if (window.ice && ice.push) {
            ice.push.connection.resumeConnection();
            resumePushGroups();
        }
    }

    function resumePushGroups() {
        for (var pushID in pushListeners) {
            var pushListener = pushListeners[pushID];
            console.log("rejoining push group with old pushid " + pushListener.group + " " + pushID);
            ice.push.addGroupMember(pushListener.group, pushID);
        }
    }

    var LAST_PAGE_KEY = "bridgeit.lastpage";

    function storeLastPage(lastPage) {
        if (!lastPage) {
            var sxkey = "#icemobilesx";
            var sxlen = sxkey.length;
            var locHash = "" + window.location.hash;
            lastPage = "" + document.location;
            if (sxkey === locHash.substring(0, sxlen)) {
                lastPage = lastPage.substring(0,
                    lastPage.length - locHash.length)
            }
        }
        setLocalStorageItem(LAST_PAGE_KEY, lastPage);
        console.log("voyent storeLastPage " + lastPage);
    }

    /* Page event handling */
    if (window.addEventListener) {
        window.addEventListener("pagehide", function () {
            //hiding the page either indicates user does not require
            //Voyent or the url scheme invocation has succeeded
            console.log('voyent clearing lauchFailed timeout on pagehide ' + new Date().getTime());
            if (ice.push && ice.push.connection) {
                pausePush();
            }
        }, false);

        window.addEventListener("pageshow", resumePush, false);

        window.addEventListener("load", storeLastPage, false);

        document.addEventListener("webkitvisibilitychange", function () {
            console.log(new Date().getTime() + ' voyent webkitvisibilitychange document.hidden=' + document.hidden + ' visibilityState=' + document.visibilityState);
            if (document.webkitHidden) {
                console.log('voyent clearing lauchFailed timeout on webkitvisibilitychange ' + new Date().getTime());
                pausePush();
            } else {
                resumePush();
            }
        });

        document.addEventListener("visibilitychange", function () {
            console.log(new Date().getTime() + ' voyent visibilitychange document.hidden=' + document.hidden + ' visibilityState=' + document.visibilityState);
            if (document.hidden) {
                console.log('voyent clearing lauchFailed timeout on visibilitychange ' + new Date().getTime());
                pausePush();
            } else {
                resumePush();
            }
        });

    }

    function jsonPOST(uri, payload) {
        var prom = new Promiz();
        var xhr = new XMLHttpRequest();
        xhr.open('POST', uri, true);
        xhr.setRequestHeader(
            "Content-Type", "application/json;charset=UTF-8");
        xhr.onreadystatechange = function () {
            if (4 == xhr.readyState) {
                if (200 == xhr.status) {
                    prom.resolve(JSON.parse(xhr.responseText));
                } else {
                    prom.reject({message: xhr.statusText, status: xhr.status});
                }
            }
        };
        xhr.send(JSON.stringify(payload));
        return prom;
    }

    function httpGET(uri, query) {
        var xhr = new XMLHttpRequest();
        var queryStr = "";
        if (!!query) {
            queryStr = "?" + query;
        }
        xhr.open('GET', uri + queryStr, false);
        xhr.send(query);
        if (xhr.status == 200) {
            return xhr.responseText;
        } else {
            throw xhr.statusText + '[' + xhr.status + ']';
        }
    }

    function endsWith(s, pattern) {
        return s.lastIndexOf(pattern) == s.length - pattern.length;
    }

    var pushPromise = new Promiz();

    function loadPushService(uri, options) {
        var baseURI = uri + (endsWith(uri, '/') ? '' : '/');
        if (ice && ice.push) {
            console.log('Push service already loaded and configured');
        } else {
            var codeURI = 'http://localhost:8080/icepush-basic/' + 'code.icepush';
            var code = httpGET(codeURI);
            eval(code);
        }

        ice.push = ice.setupPush({
            uri: baseURI,
            account: options.account,
            realm: options.realm,
            access_token: options.access_token
        });

        setupCloudPush();
        pushPromise.resolve();
    }

    var pushListeners = {};

    function addPushListenerImpl(group, callbackName) {
        if (ice && ice.push) {
            ice.push.createPushId(3, function(pushId) {
                pushListeners[pushId] = {
                    group: group,
                    callback: callbackName
                };
                ice.push.addGroupMember(group, pushId);
                if ("string" != typeof(callbackName)) {
                    console.error("Voyent Cloud Push callbacks must be named in window scope");
                } else {
                    var callback = getNamedObject(callbackName);
                    if (!!callback) {
                        if (localStorage) {
                            var callbacks = localStorage.getItem(CLOUD_CALLBACKS_KEY);
                            if (!callbacks) {
                                callbacks = " ";
                            }
                            if (callbacks.indexOf(" " + callbackName + " ") < 0) {
                                callbacks += callbackName + " ";
                            }
                            setLocalStorageItem(CLOUD_CALLBACKS_KEY, callbacks);
                        }
                    }
                }
                ice.push.register([pushId], callback);
            });
        } else {
            console.error('Push service is not active');
        }
    }

    function addOptions(base, options) {
        for (var prop in options) {
            base[prop] = options[prop];
        }
        return base;
    }

    function overlayOptions(defaults, options) {
        var merged = {};

        addOptions(merged, defaults);
        addOptions(merged, options);

        return merged;
    }

    var anonAuth = new Promiz();
    anonAuth.resolve();

    var bridgeitServiceDefaults = {
        account: "icesoft_technologies_inc",
        realm: "demo.bridgeit.mobi",
        serviceBase: "http://api.bridgeit.mobi/",
        auth: anonAuth
    };

    //Real Promise support stalled by IE
    function Promiz() {
        var thePromiz = this;
        var successes = [];
        var fails = [];
        this.then = function (success, fail) {
            if (success) {
                successes.push(success);
            }
            if (fail) {
                fails.push(fail);
            }
        };
        function callall(funcs, args) {
            for (var i = 0; i < funcs.length; i++) {
                funcs[i].apply(thePromiz, args);
            }
        }

        this.resolve = function () {
            callall(successes, arguments);
            thePromiz.then = function (success, fail) {
                success.apply(thePromiz, arguments);
            }
        };
        this.reject = function () {
            callall(fails, arguments);
            thePromiz.then = function (success, fail) {
                fail.apply(thePromiz, arguments);
            }
        }
    }


    /* *********************** PUBLIC **********************************/

    /**
     * The version of voyent.js
     * @property {String}
     */
    v.version = "1.0.8";

    /* Remove client from cloud push notifications
     * Currently this just removes the cloud push id (notifyBackURI)
     * but in the future will make a call to the push service
     * when an unregister api is available
     */
    v.unregisterCloudPush = function () {
        removeLocalStorageItem(CLOUD_PUSH_KEY);
    };


    /**
     * Verify that Voyent Cloud Push is registered.
     *
     * @alias plugin.isRegistered
     *
     */
    v.isRegistered = function () {
        return !!(getCloudPushId());
    };

    var jguid;

    /**
     * Returns a persistent id that allows an application to persistently maintain information for
     * an individual user without requiring a server-side session.
     * @alias plugin.getId
     */
    v.getId = function () {
        var JGUID_KEY = "bridgeit.jguid";
        if (!jguid) {
            jguid = getLocalStorageItem(JGUID_KEY);
            if (!jguid) {
                jguid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
                    function (c) {
                        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString(16);
                    });
                setLocalStorageItem(JGUID_KEY, jguid);
            }

        }
        return jguid;
    };


    var CLOUD_CALLBACKS_KEY = "bridgeit.cloudcallbacks";

    /**
     * Public callback used by Cloud Push implementation
     * to relay push event to a newly opened browser window.
     * This API is not for application use.
     * @alias plugin.handleCloudPush
     * @private
     */
    v.handleCloudPush = function () {
        var callbacks = getLocalStorageItem(CLOUD_CALLBACKS_KEY);
        var parts = callbacks.split(" ");
        var callback;
        for (var i = 0; i < parts.length; i++) {
            callback = getNamedObject(parts[i]);
            if (callback) {
                callback();
            }
        }
    };

    /**
     * Voyent Services login.
     * @alias login
     * @param username User name
     * @param password User password
     * @param options Additional options
     */
    v.login = function (username, password, options) {
        var auth = new Promiz();

        options = overlayOptions(bridgeitServiceDefaults, options);
        //need to also allow specified auth URL in options
        var uri = options.serviceBase + "/auth/";
        var loginURI = uri + options.account + "/realms/" + options.realm + "/token";
        var loginRequest = {
            username: username,
            password: password
        };
        jsonPOST(loginURI, loginRequest).then(
            function (jsonResult) {
                addOptions(auth, jsonResult);
                auth.resolve(auth);
            },
            function (err) {
                auth.reject(err);
            }
        );

        //save default authorization if default realm
        if (options.account == bridgeitServiceDefaults.account && options.realm === bridgeitServiceDefaults.realm) {
            bridgeitServiceDefaults.auth = auth;
        }
        return auth;
    };

    /**
     * Set up Voyent Services.
     * @alias useServices
     * @param param object with named parameters
     */
    v.useServices = function (param) {
        if ("object" === typeof arguments[0]) {
            bridgeitServiceDefaults = overlayOptions(bridgeitServiceDefaults, param);
        }
    };

    /**
     * Configure Push service and connect to it.
     * @alias plugin.usePushService
     * @param uri the location of the service
     */
    v.usePushService = function (uri, options) {
        options = overlayOptions(bridgeitServiceDefaults, options);

        if (0 == arguments.length) {
            uri = bridgeitServiceDefaults.serviceBase + "/notify";
        } else if ("object" === typeof arguments[0]) {
            if (!!arguments[0].account) {
                account = arguments[0].account;
            }
            if (!!arguments[0].realm) {
                realm = arguments[0].realm;
            }
            if (!!arguments[0].serviceBase) {
                uri = arguments[0].serviceBase + "/notify";
            }
            if (!!arguments[0].auth) {
                auth = arguments[0].auth;
            }
        } else {
            //legacy uri,apikey
        }

        bridgeitServiceDefaults.auth.then(function () {
            loadPushService(uri, options);
        });
    };

    /**
     * Add listener for notifications belonging to the specified group.
     * Callbacks must be passed by name to receive cloud push notifications.
     * @param group
     * @param callback
     * @alias plugin.addPushListener
     */
    v.addPushListener = function (group, callback) {
        pushPromise.then(function () {
            addPushListenerImpl(group, callback);
        });
    };

    /**
     * Augment a URL so that callbacks will be invoked upon Cloud Push
     * return.
     * If called with no argument, the current URL is used.
     * @param url
     * @alias plugin.cloudPushReturnURL
     */
    v.cloudPushReturnURL = function (url) {
        if (!url) {
            if (localStorage) {
                url = localStorage[LAST_PAGE_KEY];
            }
        }
        if (!url) {
            url = window.location.href;
        }
        var seq = (new Date()).getTime();
        var urlExtra =
            btoa("!h=" + escape("c=bridgeit.handleCloudPush&seq=" + seq));
        urlExtra = urlExtra.replace(/=/g, "~");
        urlExtra = urlExtra.replace(/\//g, ".");
        var returnURL = url + "#icemobilesx_" + urlExtra;
        return returnURL;
    };

    /**
     * Push notification to the group.
     *
     * This will result in an Ajax Push (and associated callback)
     * to any web pages that have added a push listener to the
     * specified group.  If Cloud Push options are provided
     * (options.subject and options.detail) a Cloud Push will
     * be dispatched as a home screen notification to any devices
     * unable to recieve the Ajax Push via the web page.
     *
     * @param {String} groupName The Ajax Push group name to push to
     * @param {Object} options Options that a notification can carry
     * @param {String} options.subject The subject heading for the notification
     * @param {String} options.message The message text to be sent in the notification body
     * @alias plugin.push
     */
    v.push = function (groupName, options) {
        if (ice && ice.push) {
            console.log("voyent.push " + JSON.stringify(options));
            if (options && options.delay) {
                ice.push.notify(groupName, options, options);
            } else {
                ice.push.notify(groupName, options);
            }
        } else {
            console.error('Push service is not active');
        }
    };

    /**
     * Push notification to one or more groups resulting from a
     * query to the Doc Service.  The query is to be in MongoDB
     * format.
     *
     * This will result in an Ajax Push (and associated callback)
     * to any web pages that have added a push listener to a group
     * that resulted from the query sent to the Doc Service.  If
     * Cloud Push options are provided (options.subject and
     * options.detail) a Cloud Push will be dispatched as a home
     * screen notification to any devices unable to receive the
     * Ajax Push via the web page.
     *
     * @param {String} docServiceQuery The query to be sent to the Doc Service.
     * @param {String} docServiceFields The fields to be sent to the Doc Service.
     * @param {String} docServiceOptions The options to be sent to the Doc Service.
     * @param {Object} options Options that a notification can carry
     * @param {String} options.subject The subject heading for the notification
     * @param {String} options.message The message text to be sent in the notification body
     * @alias plugin.pushQuery
     */
    v.pushQuery = function (docServiceQuery, docServiceFields, docServiceOptions, options) {
        if (ice && ice.push) {
            if (options) {
                console.log("voyent.push " + JSON.stringify(options));
            }
            ice.push.notifyQuery(docServiceQuery, docServiceFields, docServiceOptions, options);
        } else {
            console.error('Push service is not active');
        }
    };
})(voyent);
