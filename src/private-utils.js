function PrivateUtils(services) {
    function validateRequiredRealm(params, reject){
        validateParameter('realm', 'The BridgeIt realm is required', params, reject);
    }

    function validateAndReturnRequiredAccessToken(params, reject){
        var token = params.accessToken || services.auth.getLastAccessToken();
        if( token ){
            return token;
        }
        else{
            return reject(Error('A BridgeIt access token is required'));
        }
    }

    function validateAndReturnRequiredRealmName(params, reject){
        var realm = params.realmName;
        if( realm ){
            realm = encodeURI(realm);
        }
        else{
            realm = services.auth.getLastKnownRealm();
        }
        if( realm ){
            setSessionStorageItem(btoa(REALM_KEY), btoa(realm));
            return realm;
        }
        else{
            return reject(Error('The BridgeIt realm is required'));
        }
    }

    function validateAndReturnRequiredRealm(params, reject){
        var realm = params.realm;
        if( realm ){
            realm = encodeURI(realm);
        }
        else{
            realm = services.auth.getLastKnownRealm();
        }
        if( realm ){
            setSessionStorageItem(btoa(REALM_KEY), btoa(realm));
            return realm;
        }
        else{
            return reject(Error('The BridgeIt realm is required'));
        }
    }

    function validateAndReturnRequiredAccount(params, reject){
        var account = params.account;
        if( account ){
            account = encodeURI(account);
        }
        else{
            account = services.auth.getLastKnownAccount();
        }
        if( account ){
            setSessionStorageItem(btoa(ACCOUNT_KEY), btoa(account));
            return account;
        }
        else{
            return reject(Error('The BridgeIt account is required'));
        }
    }

    function validateAndReturnRequiredUsername(params, reject){
        var username = params.username;
        if( !username ){
            username = services.auth.getLastKnownUsername();
        }
        if( username ){
            setSessionStorageItem(btoa(USERNAME_KEY), btoa(username));
            return username;
        }
        else{
            return reject(Error('The BridgeIt username is required'));
        }
    }

    function validateRequiredUsername(params, reject){
        validateParameter('username', 'The username parameter is required', params, reject);
    }


    function validateRequiredId(params, reject){
        validateParameter('id', 'The id is required', params, reject);
    }

    function validateRequiredData(params, reject){
        validateParameter('data', 'The data parameter is required', params, reject);
    }

    function validateParameter(name, msg, params, reject){
        if( !params[name] ){
            reject(Error(msg));
        }
    }

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

    function getTransactionURLParam(){
        var txId = services.getLastTransactionId();
        if( txId ){
            return 'tx=' + txId;
        }
        else{
            return 'tx=null';
        }
    }

    function getRealmResourceURL(servicePath, account, realm, resourcePath, token, ssl, params){
        var protocol = ssl ? 'https://' : 'http://';
        var txParam = getTransactionURLParam();
        var url = protocol + servicePath +
            '/' + account + '/realms/' + realm + '/' + resourcePath + '?' +
            (token ? 'access_token=' + token : '') +
            (txParam ? '&' + txParam : '');
        if( params ){
            for( var key in params ){
                var param = params[key];
                if( typeof param === 'object'){
                    try{
                        param = JSON.stringify(param);
                    }
                    catch(e){
                        param = params[key];
                    }
                }
                url += ('&' + key + '=' + param);
            }
        }
        return url;
    }

    function extractResponseValues(xhr){
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

    function findFunctionInGlobalScope(fn){
        if (!fn)  {
            return null;
        }
        var functionName;
        if( typeof fn === "string" ){
            functionName = fn;
            var parts = functionName.split(".");
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
        else if( typeof fn === "function" ){
            return fn;
        }
    }

    return {
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
        'validateAndReturnRequiredUsername': validateAndReturnRequiredUsername,
        'validateRequiredRealm': validateRequiredRealm,
        'validateAndReturnRequiredRealm': validateAndReturnRequiredRealm,
        'validateAndReturnRequiredRealmName': validateAndReturnRequiredRealmName,
        'validateAndReturnRequiredAccount': validateAndReturnRequiredAccount,
        'validateAndReturnRequiredAccessToken': validateAndReturnRequiredAccessToken,
        'validateRequiredId': validateRequiredId,
        'validateRequiredData': validateRequiredData
    }
}