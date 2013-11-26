/* BridgeIt Mobile 1.0.0 
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
if (!window['bridgeit']) {
    window.bridgeit = {};
    window.bridgeIt = window.bridgeit; //alias bridgeit and bridgeIt
}
if (!window.console) {
    console = {};
    if (ice.logInContainer) {
        console.log = ice.logInContainer;
    } else {
        console.log = function() {
        };
        console.error = function() {
        };
    }
}
/**
 * The BridgeIt JavaScript API. Native Mobile integration for your web app.
 * 
 * BridgeIt provides a variety of device commands that allow access to 
 * device features from JavaScript, all while running in the stock browser
 * such as Safari or Chrome. This is made possible by the BridgeIt utilty app
 * that runs alongside the browser and is available for each of the supported
 * platforms (currently Android, iOS, and Windows Phone 8).
 * 
 * For example, bridgeit.camera('myCamera', 'myCallback') will allow the user
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
 * the result of the command), and options.parameters (extra parameters 
 * specific to the command)
 * 
 * @class bridgeit
 */
(function(b) {
    
    /* *********************** PRIVATE ******************************/
    function serializeForm(formId, typed) {
        var form = document.getElementById(formId);
        var els = form.elements;
        var len = els.length;
        var qString = [];
        var addField = function(name, value) {
            var tmpStr = "";
            if (qString.length > 0) {
                tmpStr = "&";
            }
            tmpStr += encodeURIComponent(name) + "=" + encodeURIComponent(value);
            qString.push(tmpStr);
        };
        for (var i = 0; i < len; i++) {
            var el = els[i];
            if (!el.disabled) {
                var prefix = "";
                if (typed) {
                    var vtype = el.getAttribute("data-type");
                    if (vtype) {
                        prefix = vtype + "-";
                    } else {
                        prefix = el.type + "-";
                    }
                }
                switch (el.type) {
                    case 'submit':
                    case 'button':
                    case 'fieldset':
                        break;
                    case 'text':
                    case 'password':
                    case 'hidden':
                    case 'textarea':
                        addField(prefix + el.name, el.value);
                        break;
                    case 'select-one':
                        if (el.selectedIndex >= 0) {
                            addField(prefix + el.name, el.options[el.selectedIndex].value);
                        }
                        break;
                    case 'select-multiple':
                        for (var j = 0; j < el.options.length; j++) {
                            if (el.options[j].selected) {
                                addField(prefix + el.name, el.options[j].value);
                            }
                        }
                        break;
                    case 'checkbox':
                    case 'radio':
                        if (el.checked) {
                            addField(prefix + el.name, el.value);
                        }
                        break;
                    default:
                        addField(prefix + el.name, el.value);
                }
            }
        }
        // concatenate the array
        return qString.join("");
    }
    var useBase64 = false;
    if (window.jQuery && jQuery.mobile)  {
        //jquery mobile insists on parsing BridgeIt hashchange data
        useBase64 = true;;
    }
    function getDeviceCommand()  {
        var sxkey = "#icemobilesx";
        var sxlen = sxkey.length;
        var locHash = "" + window.location.hash;
        if (sxkey === locHash.substring(0, sxlen))  {
            return locHash.substring(sxlen + 1);
        }
        return null;
    }
    function deviceCommandExec(command, id, options)  {
        console.log("deviceCommandExec('" + command + "', '" + id + ", " + JSON.stringify(options));
        var ampchar = String.fromCharCode(38);
        var uploadURL;
        var sessionid;
        var params;
        var element;
        var formID;
        var callback;

        if (options)  {
            if (options.postURL)  {
                uploadURL = options.postURL;
            }
            if (options.JSESSIONID)  {
                sessionid = options.JSESSIONID;
            }
            if (options.parameters)  {
                if ("string" === typeof options.parameters)  {
                    params = options.parameters;
                } else {
                    params = packObject(options.parameters);
                }
            }
            if (options.deviceCommandCallback)  {
                callback = options.deviceCommandCallback;
                if ("string" != typeof(callback))  {
                    if (bridgeit.allowAnonymousCallbacks)  {
                        callback = "!anon";
                    } else  {
                        console.error(
                            "BridgeIt callbacks must be named in window scope");
                        callback = null;
                    }
                }
            }
            if (options.element)  {
                element = options.element;
            }
            if (options.form)  {
                formID = options.form.getAttribute("id");
            }
        }

        if (!uploadURL)  {
            uploadURL = getUploadURL(element);
        }

        var windowLocation = window.location;
        var barURL = windowLocation.toString();
        var baseURL = barURL.substring(0,
                barURL.lastIndexOf("/")) + "/";

        var returnURL = "" + window.location;
        var lastHash = returnURL.lastIndexOf("#");
        var theHash = "";
        var theURL = returnURL;
        if (lastHash > 0)  {
            theHash = returnURL.substring(lastHash);
            theURL = returnURL.substring(0, lastHash);
        }
        returnURL = theURL + "#icemobilesx";
 
        var hashSubClause = "";
        if (!!theHash)  {
            hashSubClause = "&h=" + escape(theHash);
        }

        var callbackClause = "";
        if (!!callback)  {
            callbackClause = "&c=" + escape(callback);
        }

        var hashClause = "";
        if (!!hashSubClause || !!callbackClause)  {
            hashClause = "&h=" + escape(hashSubClause) + escape(callbackClause);
        }

        deviceOptions = null;
        if (useBase64)  {
            //jquery mobile insists on parsing BridgeIt hashchange data
            deviceOptions = "enc=base64";
        }
        var optionsClause = "";
        if (!!deviceOptions)  {
            optionsClause = "&o=" + escape(deviceOptions);
        }

        if (params && ("" != params)) {
            params = "&ub=" + escape(baseURL) + ampchar + params;
        }

        var sessionidClause = "";
        if (sessionid && ("" != sessionid)) {
            sessionidClause = "&JSESSIONID=" + escape(sessionid);
            //also need PHPSESSID and ASPSESSIONID
        }
        var serializedFormClause = "";
        if (formID && ("" != formID))  {
            serializedFormClause = "&p=" +
                    escape(serializeForm(formID, false));
        }
        var uploadURLClause = "";
        if (uploadURL && ("" != uploadURL))  {
            uploadURLClause = "&u=" + escape(uploadURL);
        }
        var sxURL = "c=" + escape(command +
                "?id=" + id + ampchar + (params ? params : '')) +
                uploadURLClause + 
                "&r=" + escape(returnURL) +
                sessionidClause +
                optionsClause +
                hashClause +
                serializedFormClause;
        if (b.isWindowsPhone8())  {
            sxURL = escape(sxURL);
        }
        var sxBase = "icemobile:";
        if (b.isAndroid())  {
            sxBase = "http://bridgeit.mobi/android/install/index.html#"
        }
        sxURL = sxBase + sxURL;
        console.log('sxURL=' + sxURL);

        window.location = sxURL;
    }
    function getSplashClause()  {
        var splashClause = "";
        if (null != bridgeit.splashImageURL)  {
            var splashImage = "i=" + escape(bridgeit.splashImageURL);
            splashClause = "&s=" + escape(splashImage);
        }
        return splashClause;
    }
    var autoDetectUploadURL = false;
    function getUploadURL(element)  {
        if (!autoDetectUploadURL)  {
            return null;
        }
        var uploadURL;

        var windowLocation = window.location;
        var barURL = windowLocation.toString();
        var baseURL = barURL.substring(0,
                barURL.lastIndexOf("/")) + "/";

        if (!element)  {
            uploadURL = baseURL;
        } else {
            var form = formOf(element);
            formID = form.getAttribute('id');
            var formAction = form.getAttribute("action");

            if (!uploadURL) {
                uploadURL = element.getAttribute("data-posturl");
            }
            if (!uploadURL) {        
                if (0 === formAction.indexOf("/")) {
                    uploadURL = window.location.origin + formAction;
                } else if ((0 === formAction.indexOf("http://")) ||
                        (0 === formAction.indexOf("https://"))) {
                    uploadURL = formAction;
                } else {
                    uploadURL = baseURL + formAction;
                }
            }
        }
        return uploadURL;
    }
    var checkTimeout;
    function deviceCommand(command, id, callback, options)  {
        if( !b.isSupportedPlatform(command) ){
            b.notSupported(id, command);
            return;
        }
        if (navigator.userAgent.toLowerCase().indexOf('android') < 0)  {
            checkTimeout = setTimeout( function()  {
                bridgeit.launchFailed(id);
            }, 2000);
        }
        if (!options)  {
            options = {};
        }
        console.log(command + " " + id);
        bridgeit.deviceCommandCallback = callback;
        options.deviceCommandCallback = callback;
        deviceCommandExec(command, id, options);
    }
    function setInput(target, name, value, vtype)  {
        console.log('setInput(target=' + target + ', name=' + name + ', value=' + value + ', vtype=' + vtype);
        var hiddenID = name + "-hid";
        var existing = document.getElementById(hiddenID);
        if (existing)  {
            existing.setAttribute("value", value);
            return;
        }
        var targetElm = document.getElementById(target);
        if (!targetElm)  {
            return;
        }
        var hidden = document.createElement("input");

        hidden.setAttribute("type", "hidden");
        hidden.setAttribute("id", hiddenID);
        hidden.setAttribute("name", name);
        hidden.setAttribute("value", value);
        if (vtype)  {
            hidden.setAttribute("data-type", vtype);
        }
        targetElm.parentNode.insertBefore(hidden, targetElm);
    }
    function formOf(element) {
        var parent = element;
        while (null != parent) {
            if ("form" == parent.nodeName.toLowerCase()) {
                return parent;
            }
            parent = parent.parentNode;
        }
    }
    function packObject(params)  {
        var packed = "";
        var sep = "";
        for (var key in params)  {
            packed += sep + escape(key) + "=" + escape(params[key]);
            sep = "&";
        }
        return packed;
    }
    function unpackDeviceResponse(data)  {
        var result = {};
        if (useBase64 && (data.indexOf("!") < 0))  {
            data = data.replace(/~/g,"=");
            data = data.replace(/\./g,"/");
            data = unescape(atob(data));
        }
        var params = data.split("&");
        var len = params.length;
        for (var i = 0; i < len; i++) {
            var splitIndex = params[i].indexOf("=");
            var paramName = unescape(params[i].substring(0, splitIndex));
            var paramValue = unescape(params[i].substring(splitIndex + 1));
            if ("!" === paramName.substring(0,1))  {
                //ICEmobile parameters are set directly
                result[paramName.substring(1)] = paramValue;
            } else  {
                //only one user value is supported
                result.name = paramName;
                result.value = paramValue;
            }
        }
        return result;
    }
    function url2Object(encoded)  {
        var parts = encoded.split("&");
        var record = {};
        for (var i = 0; i < parts.length; i++) {
            if (!!parts[i])  {
                var pair = parts[i].split("=");
                record[unescape(pair[0])] = unescape(pair[1]);
            }
        }
        return record;
    }
    function getNamedObject(name)  {
        var parts = name.split(".");
        var theObject = window;
        for (var i = 0; i < parts.length; i++) {
            theObject = theObject[parts[i]];
            if (!theObject) {
                return null;
            }
        }
        if (window == theObject)  {
            return null;
        }
        return theObject;
    }
    function addOnLoadListener(func)  {
        var oldonload = window.onload;
        window.onload = function() {
            try {
                if (oldonload)  {
                    oldonload();
                }
            } catch (e)  {
                console.error(e);
            }
            func();
        }
    }
    var isDataPending = false;
    var isLoaded = false;
    var pendingData = null;
    function loadComplete()  {
        isLoaded = true;
    }
    function checkExecDeviceResponse()  {
        var data = getDeviceCommand();
        if (null == data)  {
            data = pendingData;
            //record URL/hash changes that are not device commands
            storeLastPage();
        }
        var deviceParams;
        if (null != data)  {
            pendingData = data;
            isDataPending = true;
            if (!isLoaded)  {
                console.log("checkExecDeviceResponse waiting for onload");
                return;
            }
            var name;
            var value;
            var needRefresh = true;
            if ("" != data)  {
                deviceParams = unpackDeviceResponse(data);
                if (deviceParams.name)  {
                    name = deviceParams.name;
                    value = deviceParams.value;
                    setInput(name, name, value);
                    needRefresh = false;
                }
            }
            if (needRefresh)  {
                console.log('needs refresh');
                if (window.ice.ajaxRefresh)  {
                    ice.ajaxRefresh();
                }
            }
            setTimeout( function(){
                if (!isDataPending)  {
                    console.log("checkExecDeviceResponse is done, exiting");
                    return;
                }
                var sxEvent = {
                    name : name,
                    value : value
                };
                var callback = bridgeit.deviceCommandCallback;
                console.log('sxEvent: ' + sxEvent);
                var restoreHash = "";
                if (deviceParams)  {
                    if (deviceParams.r)  {
                        sxEvent.response = deviceParams.r;
                    }
                    if (deviceParams.p)  {
                        sxEvent.preview = deviceParams.p;
                    }
                    if (deviceParams.c)  {
                        setCloudPushId(deviceParams.c);
                        if (ice.push)  {
                            ice.push.parkInactivePushIds(
                                    deviceParams.c );
                        }
                    }
                    if (deviceParams.h)  {
                        var echoed = url2Object(unescape(deviceParams.h));
                        if (echoed.h)  {
                            restoreHash = echoed.h;
                        }
                        if (echoed.c)  {
                            var namedCallBack = getNamedObject(echoed.c);
                            if (namedCallBack)  {
                                callback = namedCallBack;
                            }
                        }
                    }
                }
                var loc = window.location;
                
                isDataPending = false;
                pendingData = null;
                if (callback)  {
                    try {
                        callback(sxEvent);
                        window.history.back();
                    } catch (e)  {
                        console.error("Device function callback failed " + e);
                        console.error(e.stack);
                    }
                    bridgeit.deviceCommandCallback = null;
                } else{
                    console.log('no deviceCommandCallback registered :(');
                }
            }, 1);
        }
    }
    var CLOUD_PUSH_KEY = "ice.notifyBack";
    function setCloudPushId(id)  {
        //rely on local storage since cloud push is on modern platforms
        if (localStorage)  {
            localStorage.setItem(CLOUD_PUSH_KEY, id);
        }
    }
    function getCloudPushId()  {
        if (localStorage)  {
            return localStorage.getItem(CLOUD_PUSH_KEY);
        }
        return null;
    }

    function setupCloudPush()  {
        var cloudPushId = getCloudPushId();
        if (!!cloudPushId)  {
            if (ice.push)  {
                console.log("Cloud Push registered: " + cloudPushId);
                ice.push.parkInactivePushIds(cloudPushId);
            }
        }
    }

    function storeLastPage()  {
        var LAST_PAGE_KEY = "bridgeit.lastpage";
        if (localStorage)  {
            localStorage.setItem(LAST_PAGE_KEY, document.location);
        }
    }
    /* Page event handling */
    if (window.addEventListener) {

        window.addEventListener("pagehide", function () {
            //hiding the page either indicates user does not require
            //BridgeIt or the url scheme invocation has succeeded
            clearTimeout(checkTimeout);
            if (ice.push && ice.push.connection) {
                ice.push.connection.pauseConnection();
            }
        }, false);

        window.addEventListener("pageshow", function () {
            if (ice.push && ice.push.connection) {
                ice.push.connection.resumeConnection();
            }
        }, false);

        window.addEventListener("hashchange", function () {
            console.log('entered hashchange listener hash=' + window.location.hash);
            checkExecDeviceResponse();
        }, false);

        window.addEventListener("load", function () {
            storeLastPage();
        }, false);

    };

    function httpGET(uri, query) {
        var xhr = new XMLHttpRequest();
        var queryStr = "";
        if (!!query)  {
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

    var absoluteGoBridgeItURL = null;

    function fetchGoBridgeIt(url) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (4 == xhr.readyState)  {
                if (200 == xhr.status)  {
                    if (!absoluteGoBridgeItURL)  {
                        absoluteGoBridgeItURL = getAbsoluteURL(url);
                        console.log("Cloud Push return via goBridgeIt: " + 
                                absoluteGoBridgeItURL);
                    }
                }
            }
        };
        xhr.open('GET', url, true);
        xhr.send();
    }

    function findGoBridgeIt() {
        if (!!bridgeit.goBridgeItURL)  {
            //page setting overrides detection
            absoluteGoBridgeItURL = getAbsoluteURL(bridgeit.goBridgeItURL);
            return;
        }
        //host-wide page
        fetchGoBridgeIt('/goBridgeIt.html');
        //application-specific page
        fetchGoBridgeIt('goBridgeIt.html');
    }

    function getAbsoluteURL(url)  {
        var img = document.createElement('img');
        img.src = url;
        url = img.src;
        return url;
    }

    function loadPushService(uri, apikey) {
        if (ice && ice.push) {
            console.log('Push service already loaded and configured');
        } else {
            var baseURI = uri + (endsWith(uri, '/') ? '' : '/');
            var codeURI = baseURI + 'code.icepush';
            var code = httpGET(codeURI);
            eval(code);

            ice.push.configuration.contextPath = baseURI;
            ice.push.configuration.apikey = apikey;
            ice.push.connection.startConnection();
            findGoBridgeIt();
        }
        setupCloudPush();
    }

    function addPushListenerImpl(group, callback) {
        if (ice && ice.push && ice.push.configuration.contextPath) {
            ice.push.connection.resumeConnection();

            var pushId = ice.push.createPushId();
            ice.push.addGroupMember(group, pushId);
            if ("string" != typeof(callback))  {
                console.error(
                    "BridgeIt Cloud Push callbacks must be named in window scope");
            } else {
                var callbackName = callback;
                callback = getNamedObject(callback);
                if (!!callback)  {
                    if (localStorage)  {
                        var callbacks = localStorage
                                .getItem(CLOUD_CALLBACKS_KEY);
                        if (!callbacks)  {
                            callbacks = " ";
                        }
                        if (callbacks.indexOf(" " + callbackName + " ") < 0)  {
                            callbacks += callbackName + " ";
                        }
                        localStorage.setItem(CLOUD_CALLBACKS_KEY, callbacks);
                    }
                }
            }
            ice.push.register([ pushId ], callback);
        } else {
            console.error('Push service is not active');
        }
    };

    /* *********************** PUBLIC **********************************/
    
    /**
     * Application provided callback to detect BridgeIt launch failure.
     * This should be overridden with an implementation that prompts the
     * user to download BridgeIt and potentially fallback with a different
     * browser control such as input file.
     *   
     * @alias plugin.launchFailed
     * @param {String} id The id passed to the command that failed 
     * @template
     */
    b.launchFailed = function(id)  {
        alert("BridgeIt not available for " + id);
    };

    /**
     * Application provided callback to detect non-supported clients.
     * This should be overridden with an implementation that informs the
     * user the user that native mobile functionality is only available
     * on supported platforms or potentially fallback with a different
     * browser control such as input file, which would be available on 
     * all browsers.
     * @param {String} id The id passed to the command that failed
     * @param {String} command The BridgeIt api command that was launched
     * @alias plugin.notSupported
     * @template
     */
    b.notSupported = function(id, command)  {
        alert('Sorry, the command ' + command + ' for BridgeIt is not supported on this platform');
    };


    /**
     * Launch the device QR Code scanner. 
     * 
     * The callback function will be called once the scan is captured.
     * The return value will be set to the text resulting from the scan.
     * 
     * The QR Code scanner does not currently accept additional parameters,
     * but these may used in the future.
     * 
     * @alias plugin.scan
     * @param {Object} options Additional command options
     * @param {String} options.postURL Server-side URL accepting POST of command result (optional)
     * @param {Object} options.parameters Additional command-specific parameters
     * @param {String} id The id of the return value
     * @param {Function} callback The callback function.
     * 
     */
    b.scan = function(id, callback, options)  {
        deviceCommand("scan", id, callback, options);
    };

    /**
     * Launch the native camera.
     * 
     * The callback function will be called once the photo is captured.
     * 
     * @alias plugin.camera
     * @param {Object} options Additional command options
     * @param {String} options.postURL Server-side URL accepting POST of command result (optional)
     * @param {Object} options.parameters Additional command-specific parameters
     * @param {Object} options.parameters.maxwidth The maxium width for the image in pixels
     * @param {Object} options.parameters.maxheight The maxium height for the image in pixels
     * @param {String} id The id of the return value
     * @param {Function} callback The callback function.
     * 
     */
    b.camera = function(id, callback, options)  {
        deviceCommand("camera", id, callback, options);
    };
    /**
     * Launch the native video recorder.
     * 
     * The callback function will be called once the video has been captured.
     * 
     * @alias plugin.camcorder
     * @inheritdoc #scan
     * 
     */
    b.camcorder = function(id, callback, options)  {
        deviceCommand("camcorder", id, callback, options);
    };
    /**
     * Launch the native audio recorder.
     * 
     * The callback function will be called once the audio is captured.
     * 
     * @alias plugin.microphone
     * @inheritdoc #scan
     * 
     */
    b.microphone = function(id, callback, options)  {
        deviceCommand("microphone", id, callback, options);
    };
    
    /**
     * Launch the native contact list.
     * 
     * The callback function will be called once the contact is retrieved.
     * 
     * @alias plugin.fetchContact
     * @param {String} id The id of the return value
     * @param {Function} callback The callback function.
     * @param {Object} options Additional command options
     * @param {Object} options.parameters parameters map
     * @param {Object} options.parameters.fields The contact fields to retrieve, default = "name,email,phone"
     * 
     */
    b.fetchContact = function(id, callback, options)  {
        var ops = options || {};
        if( !ops.parameters ){
            ops.parameters = {};
            ops.parameters.fields = "name,email,phone";
        }
        deviceCommand("fetchContacts", id, callback, ops);
    };

    /**
     * Send an SMS message.
     * 
     * The sms function will send an SMS message to a number on supported
     * platforms. On iOS devices, a native SMS call is made through the
     * BridgeIt utility app. On other platforms an SMS URL protocol is used in a
     * DOM anchor element, which the browser may use to launch the device
     * SMS functionality, if available.
     * 
     * @alias plugin.sms
     * @param {String} number The phone number to send the message to
     * @param {String} message The message
     * 
     */
    b.sms = function(number, message)  {
        if( !b.isSupportedPlatform('sms') ){
            b.notSupported(null, 'sms');
            return;
        }
        if( number == 'undefined' || number == '')
            return;
        if( b.isIOS()){
            deviceCommand('sms', '_sms', null, {parameters:{n: number, body: message}});
        }
        else{
            var smsBtn = document.createElement('a');
            var cleanNumber = number.replace(/[\s-\.\+]/g,'');
            smsBtn.href = 'sms:+' + cleanNumber + '?body=' + encodeURI(message);
            smsBtn.style = 'display:none';
            document.body.appendChild(smsBtn);
            smsBtn.click();
            document.removeChild(smsBtn);
         }
    };
    
    /**
     * Launch an Augmented Reality view.
     * 
     * The Augmented Reality view displays a set of geographic icons on
     * a video overlay. The icons are positioned according to the 
     * orientation of the device so that they appear in a line-of-sight
     * with their physical geographic position.  The user can select an
     * icon and this is relayed back to the application.
     * 
     * The callback function will be called once the augmented reality
     * view exits with the user selection provided in the return value.
     * The command is invoked with a locations parameter containing an
     * array of named locations, each with a comma-separated latitude,
     * longitude, altitude, direction, and icon URL
     * 
     * @alias plugin.augmentedReality
     * @param {Object} options Additional command options
     * @param {Object} options.parameters parameters map
     * @param {Object} options.parameters.locations The augmented reality locations to display
     * @inheritdoc #scan
     * 
     */
    b.augmentedReality = function(id, callback, options)  {
        deviceCommand("aug", id, callback, options);
    };
    
    /**
     * Activate location tracking. 
     * 
     * Location tracking will run in the
     * background according to the specified strategy and duration, and will POST
     * a geoJSON record to the specified postURL.
     * 
     * Three strategies are currently supported: "continuous" where the location
     * of the device will be uploaded as frequently as it changes (intended for
     * testing only due to high power consumption), "significant" where the
     * location is uploaded when it changes significantly, and "stop" to cease
     * location tracking.
     * 
     * The callback function will be called once location tracking is activated.
     * 
     * @param {Object} options Additional command options
     * @param {String} options.postURL The URL accepting the geoJSON POST
     * @param {String} options.parameters parameters map
     * @param {String} options.parameters.strategy The strategy, "continuous", "significant" or "stop"
     * @param {String} options.parameters.duration The duration in hours
     * @alias plugin.geoTrack
     * @inheritdoc #scan
     * 
     */
    b.geoTrack = function(id, callback, options)  {
        deviceCommand("geospy", id, callback, options);
    };
    /**
     * Register BridgeIt integration and configure Cloud Push.
     * 
     * This call is necessary to obtain the Cloud Push ID of the
     * device so that notifications can be delivered when the
     * user is not currently viewing your application in the browser.
     * 
     * The callback function will be called when Cloud Push registration
     * completes.
     * 
     * @alias plugin.register
     * @inheritdoc #scan
     * 
     */
    b.register = function(id, callback, options)  {
        deviceCommand("register", id, callback, options);
    };

    /**
     * Verify that BridgeIt Cloud Push is registered.
     * 
     * @alias plugin.isRegistered
     * 
     */
    b.isRegistered = function()  {
        return !!(getCloudPushId());
    };
    

    /**
     * Utility method to unpack url-encoded parameters into an object.
     * 
     * @alias plugin.url2Object
     * @param {String} encoded The encoded URL string to unpack
     */
    b.url2Object = function(encoded)  {
        return url2Object(encoded);
    };

    /**
     * Set allowAnonymousCallbacks to true to take advantage of persistent
     * callback functions currently supported on iOS.
     * @property {Boolean} [allowAnonymousCallbacks=false]
     */
    b.allowAnonymousCallbacks = false;        

    /**
     * Is the current browser iOS
     * @alias plugin.isIOS
     * @readonly
     */
    b.isIOS = function(){
        var i = 0,
            iOS = false,
            iDevice = ['iPad', 'iPhone', 'iPod'];

        for ( ; i < iDevice.length ; i++ ) {
            if( navigator.userAgent.indexOf(iDevice[i]) > -1 ){ 
                iOS = true; break; 
            }
        }
        return iOS;
    };

    /**
     * Is the current browser iOS 6
     * @alias plugin.isIOS6
     * @readonly 
     */
    b.isIOS6 = function(){
        return /(iPad|iPhone|iPod).*OS 6_/.test( navigator.userAgent );
    };

    /**
     * Is the current browser Android
     * @property isAndroid
     * @readonly
     */
    b.isAndroid = function(){
        return navigator.userAgent.toLowerCase()
            .indexOf("android") > -1; 
    };

    /**
     * Is the current browser Android
     * @property isAndroidFroyo
     * @readonly
     */
    b.isAndroidFroyo = function(){
        return navigator.userAgent.indexOf("Android 2.2") > -1; 
    };

    /**
     * Is the current browser Android
     * @property isAndroidFroyo
     * @readonly
     */
    b.isAndroidGingerBreadOrGreater = function(){
        return b.isAndroid() && !b.isAndroidFroyo(); 
    };


    /**
     * Is the current browser Windows Phone 8
     * @property isWindowsPhone8
     * @readonly
     */
    b.isWindowsPhone8 = function(){
        var ua = navigator.userAgent;
        return ua.indexOf('IEMobile') > -1 
            || ( ua.indexOf('MSIE 10') > -1 
                && typeof window.orientation !== 'undefined');
    };

    var supportedAndroid = b.isAndroidGingerBreadOrGreater();
    var iOS = b.isIOS();
    var iOS6 = b.isIOS6();
    var wp8 = b.isWindowsPhone8();

    /**
     * Check if the current browser is supported by the BridgeIt Native Mobile app.
     *
     * Currently iOS, Android, and some features on Windows Phone 8 are supported.
     * @param {String} command The BridgeIt API command that may or may not be supported
     * @alias plugin.isSupportedPlatform
     */
    b.isSupportedPlatform = function(command){
        var supported = false;
        if( iOS6 ){ //only scan not supported on iOS6
            supported = 'scan' != command;
        }
        else if ( wp8 ){
            supported = ['camera', 'sms','fetchContacts','scan'].indexOf(command) > -1;
        }
        else if( supportedAndroid || iOS ){
            supported = true;
        }
        console.log("bridgeIt supported platform for '" + command + "' command: " + supported);
        return supported;
    };

    /**
     * The app store URL to BridgeIt for the appropirate platform
     * @property appStoreURL
     * @readonly
     */
    b.appStoreURL = function(){
        if( b.isAndroid() )
            return 'https://play.google.com/store/apps/details?id=mobi.bridgeit';
        else if( b.isIOS() )
            return 'https://itunes.apple.com/app/bridgeit/id727736414';

    };

    var jguid;

    /**
     * The id allows an application to persistently maintain information for
     * an individual user without requiring a server-side session.
     * @property getId
     * @readonly
     */
    b.getId = function()  {
        var JGUID_KEY = "bridgeit.jguid";
        if (!jguid)  {
            if (localStorage)  {
                jguid = localStorage.getItem(JGUID_KEY);
            }
            if (!jguid)  {
                jguid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
                    function(c) {
                        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                        return v.toString(16);
                    });
                if (localStorage)  {
                    localStorage.setItem(JGUID_KEY, jguid);
                }
            }

        }
        return jguid;
    }
    /**
     * Set goBridgeItURL to the URL of your goBridgeIt.html file
     * to allow {@link bridgeit#push Cloud Push} to go back to the most recent page
     * The defaults of the host root and the current relative
     * directory URL do not need to be specified. For an example, see 
     * http://bridgeit.mobi/demo/goBridgeIt.html
     *
     * @property {String} [goBridgeItURL]
     */
    b.goBridgeItURL = null;

    var CLOUD_CALLBACKS_KEY = "bridgeit.cloudcallbacks";

    /**
     * Public callback used by Cloud Push implementation
     * to relay push event to a newly opened browser window.
     * This API is not for application use.
     * @alias plugin.handleCloudPush
     * @private
     */
    b.handleCloudPush = function ()  {
        var callbacks = localStorage.getItem(CLOUD_CALLBACKS_KEY);
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
     * Configure Push service and connect to it.
     * @alias plugin.usePushService
     * @param uri the location of the service
     * @param apikey
     */
    b.usePushService = function(uri, apikey) {
        window.setTimeout(function() {
            loadPushService(uri, apikey);
        }, 1);
    };

    /**
     * Add listner for notifications belonging to the specified group.
     * Callbacks must be passed by name to receive cloud push notifications,
     * regardless of bridgeit.allowAnonymousCallbacks setting
     * @param group
     * @param callback
     * @alias plugin.addPushListener
     */
    b.addPushListener = function(group, callback) {
        window.setTimeout(function() {
            addPushListenerImpl(group, callback);
        }, 1);
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
    b.push = function(groupName, options) {
        if (!absoluteGoBridgeItURL)  {
            if (!!bridgeit.goBridgeItURL)  {
                absoluteGoBridgeItURL = getAbsoluteURL(bridgeit.goBridgeItURL);
            }
        }
        if (!!absoluteGoBridgeItURL)  {
            if (options && !options.url)  {
                options.url = absoluteGoBridgeItURL;
            }
        }
        if (ice && ice.push && ice.push.configuration.contextPath) {
            if (options && options.delay)  {
                ice.push.notify(groupName, options, options);
            } else {
                ice.push.notify(groupName, options);
            }
        } else {
            console.error('Push service is not active');
        }
    };

    //android functions as full page load
    addOnLoadListener(loadComplete);
    addOnLoadListener(checkExecDeviceResponse);
    checkExecDeviceResponse();
})(bridgeit);
