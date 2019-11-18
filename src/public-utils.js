import * as privateUtils from './private-utils'
import * as keys from "./keys";
import { updateLastActiveTimestamp } from './auth-service'

//publish some of the private utility functions
//todo: move the functions into the public-utils.js file if indeed needed
export const getLocalStorageItem = privateUtils.getLocalStorageItem;
export const setLocalStorageItem = privateUtils.setLocalStorageItem;
export const removeLocalStorageItem = privateUtils.removeLocalStorageItem;
export const getSessionStorageItem = privateUtils.getSessionStorageItem;
export const setSessionStorageItem = privateUtils.setSessionStorageItem;
export const removeSessionStorageItem = privateUtils.removeSessionStorageItem;

export let baseURL, authURL, authAdminURL, locateURL, docsURL, storageURL, eventURL,
    queryURL, actionURL, eventhubURL, mailboxURL, deviceURL, scopeURL,
    pushURL, cloudURL, activityURL, sysAdminURL, broadcastURL;

export const configureHosts = function (url) {
    if (url) {
        baseURL = url;
    }
    else {
        baseURL = window.location.protocol + '//' + window.location.hostname;
        if (window.location.port) {
            baseURL += ':' + window.location.port
        }
    }
    //remove any trailing '/'
    if (baseURL.substr(baseURL.length - 1) === '/') {
        baseURL = baseURL.slice(0, -1);
    }

    authURL = baseURL + '/auth';
    authAdminURL = baseURL + '/authadmin';
    locateURL = baseURL + '/locate';
    docsURL = baseURL + '/docs';
    storageURL = baseURL + '/storage';
    eventURL = baseURL + '/event';
    queryURL = baseURL + '/query';
    actionURL = baseURL + '/action';
    eventhubURL = baseURL + '/eventhub';
    mailboxURL = baseURL + '/mailbox';
    deviceURL = baseURL + '/device';
    scopeURL = baseURL + '/scope';
    pushURL = baseURL + '/notify';
    cloudURL = baseURL + '/cloud';
    activityURL = baseURL + '/activity';
    sysAdminURL = baseURL + '/administration';
    broadcastURL = baseURL + '/broadcast';
};

configureHosts();


/**
 * Start a Voyent transaction.
 *
 * This function will create a new transaction id, and automatially append the id to all voyent network calls.
 * A Voyent transaction is not a ACID transaction, but simply a useful method to aid in auditing and diagnosing
 * distributed network calls, especially among different services.
 *
 * @example
 *    voyent.startTransaction();
 *   console.log('started transaction: ' +  voyent.getLastTransactionId());
 *
 *    voyent.auth.login({
     *       account: accountId,
     *       username: adminId,
     *       password: adminPassword,
     *       host: host
     *   }).then(function (authResponse) {
     *       return  voyent.docs.createDocument({
     *           document: newDoc,
     *           realm: realmId
     *       });
     *   }).then(function (docURI) {
     *       newDocURI = docURI;
     *       var uriParts = docURI.split('/');
     *       var docId = uriParts[uriParts.length - 1];
     *       return  voyent.docs.deleteDocument({
     *           account: accountId,
     *           realm: realmId,
     *           host: host,
     *           id: docId
     *       })
     *   }).then(function () {
     *       console.log('completed transaction: ' +  voyent.getLastTransactionId());
     *        voyent.endTransaction();
     *   }).catch(function (error) {
     *       console.log('something went wrong with transaction: ' +  voyent.getLastTransactionId());
     *        voyent.endTransaction();
     *   });
 */
export function startTransaction() {
    privateUtils.setSessionStorageItem(btoa(keys.TRANSACTION_KEY), newUUID());
    console.log('bridgeit: started transaction ' + getLastTransactionId());
}

/**
 * End a Voyent transaction.
 *
 * This function will remove the current Voyent transaction id, if one exists.
 */
export function endTransaction() {
    privateUtils.removeSessionStorageItem(btoa(keys.TRANSACTION_KEY));
    console.log('bridgeit: ended transaction ' + getLastTransactionId());
}

/**
 * Get last transaction.
 *
 * Return the last stored Voyent transaction id.
 */
export function getLastTransactionId() {
    return privateUtils.getSessionStorageItem(btoa(keys.TRANSACTION_KEY));
}

/**
 * Sets the current realm for all subsequent operations. This is useful when logging in as an admin, who is not
 * in any realm, but needing to ensure that all other operations are done with a particular realm.
 *
 * @example
 *     voyent.auth.login({
     *      account: accountId,
     *    	username: adminId,
     *    	password: adminPassword,
     *    	host: host
     *    }).then(function(authResponse){
     *    	 voyent.setCurrentRealm('myRealm');
     *    	//realm is no longer required for all subsequent operations
     *    	return  voyent.docs.createDocument({
     *    		document: newDoc
     *    	});
     *    }).then(function(docURI){
     *    	newDocURI = docURI;
     *    	var uriParts = docURI.split('/');
     *    	var docId = uriParts[uriParts.length-1];
     *    	return  voyent.docs.deleteDocument({
     *    		account: accountId,
     *    		host: host,
     *    		id: docId
     *    	})
     *    });
 *
 *
 * @alias setCurrentRealm
 * @global
 * @param {String} realm The name of thre realm to use for future operations.
 */
export function setCurrentRealm(realm) {
    privateUtils.setSessionStorageItem(btoa(keys.REALM_KEY), btoa(realm));
}

/**
 * Return the permissions block for a resource. A permissions block has the following structure:
 *
 * @example
 *    {
     *        "_id": "de6959d0-a885-425c-847a-3289d07321ae",
     *        "owner": "jo.smith",
     *        "rights": {
     *            "owner": ["r","u","d","x","pr","pu"],
     *            "realm": ["r","x"],
     *            "roles": {
     *                "demoAdmin": ["r","u","d","x","pu"]
     *            }
     *        }
     *    }
 *
 *
 * The permissions codes:
 *
 *     r: Read
 *     u: Update
 *     d: Delete
 *     x: Execute
 *    pr: Permissions Read
 *    pu: Permissions Update
 *    mu: Client Metadata Update
 *
 *
 * @example
 *     voyent.getResourcePermissions({
     *    	account: accountId,
     *    	username: adminId,
     *    	password: adminPassword,
     *    	host: host,
     *    	service: 'docs',
     *    	path: 'documents',
     *    	id: 'resourceId'
     *    }).then(function(permissions){
     *    	console.log('permissions', permissions);
     *    });
 *
 * @alias getResourcePermissions
 * @global
 *
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *      voyent.auth.connect() will be used
 * @param {String} params.id The id of the resource to get permissions for.
 * @param {String} params.service The service that manages the resource.
 * @param {String} params.path The path to the resource.
 * @returns {Object} The permissions block for the resource.
 */
export function getResourcePermissions(params){
    return new Promise(
        function(resolve, reject) {
            params = params ? params : {};

            //validate
            const account = privateUtils.validateAndReturnRequiredAccount(params, reject);
            const realm = privateUtils.validateAndReturnRequiredRealm(params, reject);
            const token = privateUtils.validateAndReturnRequiredAccessToken(params, reject);
            privateUtils.validateRequiredId(params, reject);
            privateUtils.validateParameter('service', 'The service parameter is required', params, reject);
            privateUtils.validateParameter('path', 'The path parameter is required', params, reject);

            let serviceURL;
            switch(params.service){
                case 'docs': serviceURL = docsURL; break;
                case 'action': serviceURL = actionURL; break;
                case 'eventhub': serviceURL = eventhubURL; break;
                case 'query': serviceURL = queryURL; break;
                case 'storage': serviceURL = storageURL; break;
                case 'mailbox': serviceURL = mailboxURL; break;
                case 'locate': serviceURL = locateURL; break;
            }

            const url = privateUtils.getRealmResourceURL(serviceURL, account, realm, params.path + '/' + params.id + '/permissions', token);

            getJSON(url).then(function(json){
                updateLastActiveTimestamp();
                let permissionsBlock;
                if( json.directory && json.directory.length > 0 ){
                    permissionsBlock = json.directory[0];
                }
                else{
                    permissionsBlock = json;
                }
                resolve(permissionsBlock);
            })['catch'](function(error){
                reject(error);
            });
        }
    );
}

/**
 * Modify the permissions block for a resource. See {@link getResourcePermissions} for additional details.
 *
 * @example
 *    var permissionsBlock == {
     *        "_id": "de6959d0-a885-425c-847a-3289d07321ae",
     *        "owner": "jo.smith",
     *        "rights": {
     *            "owner": ["r","u","d","x","pr","pu"],
     *            "realm": ["r","x"],
     *            "roles": {
     *                "demoAdmin": ["r","u","d","x","pu"]
     *            }
     *        }
     *    };
 *
 * @example
 *     voyent.updateResourcePermissions({
     *    	account: accountId,
     *    	username: adminId,
     *    	password: adminPassword,
     *    	host: host,
     *    	service: 'docs',
     *    	path: 'documents',
     *    	id: 'resourceId',
     *    	permissions: permissionsBlock
     *    }).then(function(permissions){
     *    	console.log('permissions', permissions);
     *    });
 *
 *
 * @alias updateResourcePermissions
 * @global
 *
 * @param {Object} params params
 * @param {String} params.account Voyent Services account name. If not provided, the last known Voyent Account
 *     will be used.
 * @param {String} params.realm The Voyent Services realm. If not provided, the last known Voyent Realm name
 *     will be used.
 * @param {String} params.accessToken The Voyent authentication token. If not provided, the stored token from
 *      voyent.auth.connect() will be used
 * @param {String} params.id The id of the resource to get permissions for.
 * @param {String} params.service The service that manages the resource.
 * @param {String} params.path The path to the resource.
 * @returns {Object} The permissions block for the resource.
 */
export function updateResourcePermissions(params){
    return new Promise(
        function(resolve, reject) {
            params = params ? params : {};

            //validate
            const account = privateUtils.validateAndReturnRequiredAccount(params, reject);
            const realm = privateUtils.validateAndReturnRequiredRealm(params, reject);
            const token = privateUtils.validateAndReturnRequiredAccessToken(params, reject);
            privateUtils.validateRequiredId(params, reject);
            privateUtils.validateParameter('permissions', 'The permissions parameter is required', params, reject);
            privateUtils.validateParameter('service', 'The service parameter is required', params, reject);
            privateUtils.validateParameter('path', 'The path parameter is required', params, reject);

            let serviceURL;
            switch(params.service){
                case 'docs': serviceURL = docsURL; break;
                case 'action': serviceURL = actionURL; break;
            }

            const url = privateUtils.getRealmResourceURL(serviceURL, account, realm, params.path + '/' + params.id + '/permissions', token);

            put(url, params.permissions).then(function(json){
                updateLastActiveTimestamp();
                resolve(json);
            })['catch'](function(error){
                reject(error);
            });
        }
    );
}

export function serializePostData(data){
    //TODO
}

export function get(url, headers){
    return new Promise(function(resolve, reject) {
        let request = new XMLHttpRequest();
        request.open('GET', url, true);
        if( headers ){
            for(let header in headers ){
                request.setRequestHeader(header, headers[header]);
            }
        }
        request.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status >= 200 && this.status < 400) {
                    resolve(this.responseText);
                } else {
                    reject(privateUtils.extractResponseValues(this));
                }
            }
        };
        request.onabort = function(evt){
            reject(evt);
        };
        request.onerror = function(err){
            reject(err);
        };
        request.send();
        request = null;
    });
}

export function getJSON(url, headers){
    return new Promise(function(resolve, reject) {
        let request = new XMLHttpRequest();
        request.open('GET', url, true);
        if( headers ){
            for(let header in headers ){
                request.setRequestHeader(header, headers[header]);
            }
        }
        request.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status >= 200 && this.status < 400) {
                    if (this.responseText) {
                        resolve(JSON.parse(this.responseText));
                    }
                    else {
                        resolve();
                    }
                } else {
                    reject(privateUtils.extractResponseValues(this));
                }
            }
        };
        request.onabort = function(evt){
            reject(evt);
        };
        request.onerror = function(err){
            reject(err);
        };
        request.send();
        request = null;
    });
}

export function getBlob(url, headers){
    return new Promise(function(resolve, reject){
        let request = new XMLHttpRequest();
        if( headers ){
            for(let header in headers ){
                request.setRequestHeader(header, headers[header]);
            }
        }
        request.onreadystatechange = function(){
            if (this.readyState === 4){
                if( this.status === 200){
                    resolve(new Uint8Array(this.response));
                }
                else{
                    reject(this);
                }
            }
        };
        request.onabort = function(evt){
            reject(evt);
        };
        request.onerror = function(err){
            reject(err);
        };
        request.open('GET', url);
        request.responseType = 'arraybuffer';
        request.send();
        request = null;
    });
}

export function post(url, data, headers, isFormData, contentType, progressCallback, onabort, onerror){
    return new Promise(function(resolve, reject) {
        console.log('sending post to ' + url);
        contentType = contentType || "application/json";
        const request = new XMLHttpRequest();
        request.open('POST', url, true);
        if( !isFormData ){
            request.setRequestHeader("Content-type", contentType);
        }
        if( headers ){
            for(let header in headers ){
                request.setRequestHeader(header, headers[header]);
            }
        }
        if( progressCallback ){
            request.upload.addEventListener("progress", function(evt){
                updateLastActiveTimestamp();
                if (evt.lengthComputable){
                    const percentComplete = evt.loaded / evt.total;
                    progressCallback(percentComplete, request);
                }
            }, false);
        }
        request.onabort = function(evt){
            if( onabort ){
                onabort();
            }
            reject(evt);
        };
        request.onerror = function(err){
            if( onerror ){
                request.onerror = onerror;
            }
            reject(err);
        };

        request.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status >= 200 && this.status < 400) {
                    if( this.responseText ){
                        let json = null;
                        try{
                            json = JSON.parse(this.responseText);
                            resolve(json);
                        }
                        catch(e){
                            resolve(privateUtils.extractResponseValues(this));
                        }
                    }
                    else{
                        resolve(url);
                    }
                } else {
                    reject(privateUtils.extractResponseValues(this));
                }
            }
        };
        if( data ){
            request.send(isFormData ? data : JSON.stringify(data));
        }
        else{
            request.send();
        }
    });
}

export function put(url, data, headers, isFormData, contentType){
    return new Promise(function(resolve, reject) {
        console.log('sending put to ' + url);
        contentType = contentType || "application/json";
        let request = new XMLHttpRequest();
        request.open('PUT', url, true);
        request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        if( !isFormData ){
            request.setRequestHeader("Content-type", contentType);
        }
        if( headers ){
            for(let header in headers ){
                request.setRequestHeader(header, headers[header]);
            }
        }
        //request.setRequestHeader("Connection", "close");
        request.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status >= 200 && this.status < 400) {
                    if( this.responseText ){
                        let json = null;
                        try{
                            json = JSON.parse(this.responseText);
                            resolve(json);
                        }
                        catch(e){
                            resolve(privateUtils.extractResponseValues(this));
                        }
                    }
                    else{
                        resolve();
                    }
                } else {
                    reject(privateUtils.extractResponseValues(this));
                }
            }
        };
        request.onabort = function(evt){
            reject(evt);
        };
        request.onerror = function(err){
            reject(err);
        };
        if( data ){
            request.send(isFormData ? data : JSON.stringify(data));
        }
        else{
            request.send();
        }

        request = null;
    });
}

export function doDelete(url, headers){
    return new Promise(function(resolve, reject) {
        console.log('sending delete to ' + url);
        let request = new XMLHttpRequest();
        request.open('DELETE', url, true);
        if( headers ){
            for(let header in headers ){
                request.setRequestHeader(header, headers[header]);
            }
        }
        request.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status >= 200 && this.status < 400) {
                    updateLastActiveTimestamp();
                    resolve();
                } else {
                    reject(privateUtils.extractResponseValues(this));
                }
            }
        };
        request.onabort = function(evt){
            reject(evt);
        };
        request.onerror = function(err){
            reject(err);
        };
        request.send();
        request = null;
    });
}

export function newUUID()  {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function isIOS(){
    const iDevice = ['iPad', 'iPhone', 'iPod'];
    for (let i = 0; i < iDevice.length ; i++ ) {
        if (navigator.userAgent.indexOf(iDevice[i]) > -1) {
            return true;
        }
    }

    return false;
}

export function isAndroid(){
    return navigator.userAgent.toLowerCase().indexOf("android") > -1;
}