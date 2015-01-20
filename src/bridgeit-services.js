if( ! ('bridgeit' in window)){
	throw new Error('bridgeit-services.js requires bridgeit.js, please include bridgeit.js before bridgeit-services.js');
}

(function(b) {

	"use strict";

	/************************* Private ********************/

	/* Auth */
	function validateRequiredRealm(params, reject){
		validateParameter('realm', 'The BridgeIt realm is required', params, reject);
	}

	function validateRequiredPassword(params, reject){
		validateParameter('password', 'The password parameter is required', params, reject);
	}

	function validateRequiredPermissions(params, reject){
		validateParameter('permissions', 'The permissions parameter is required', params, reject);
	}

	function validateAndReturnRequiredAccessToken(params, reject){
		var token = params.accessToken || b.services.auth.getLastAccessToken();
		if( token ){
			return token;
		}
		else{
			return reject(Error('A BridgeIt access token is required'));
		}
	}

	function validateAndReturnRequiredRealm(params, reject){
		var realm = params.realm;
		if( realm ){
			realm = encodeURI(realm);
		}
		else{
			realm = b.services.auth.getLastKnownRealm();
		}
		if( realm ){
			sessionStorage.setItem(btoa(realmKey), btoa(realm));
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
			account = b.services.auth.getLastKnownAccount();
		}
		if( account ){
			sessionStorage.setItem(btoa(accountKey), btoa(account));
			return account;
		}
		else{
			return reject(Error('The BridgeIt account is required'));
		}
	}

	function validateRequiredUsername(params, reject){
		validateParameter('username', 'The username parameter is required', params, reject);
	}

	/* Locate */
	function validateRequiredRegion(params, reject){
		validateParameter('region', 'The region parameter is required', params, reject);
	}

	function validateRequiredMonitor(params, reject){
		validateParameter('monitor', 'The monitor parameter is required', params, reject);
	}

	function validateRequiredPOI(params, reject){
		validateParameter('poi', 'The poi parameter is required', params, reject);
	}

	function validateRequiredLocation(params, reject){
		validateParameter('location', 'The location parameter is required', params, reject);
	}

	function validateRequiredLat(params, reject){
		validateParameter('lat', 'The lat parameter is required', params, reject);
	}

	function validateRequiredLon(params, reject){
		validateParameter('lon', 'The lon parameter is required', params, reject);
	}

	/* Metrics */
	function validateRequiredMetric(params, reject){
		validateParameter('metric', 'The metric parameter is required', params, reject);
	}

	function validateRequiredType(params, reject){
		validateParameter('type', 'The type parameter is required', params, reject);
	}

	/* Storage */
	function validateRequiredBlob(params, reject){
		validateParameter('blob', 'The blob parameter is required', params, reject);
	}

	function validateRequiredFile(params, reject){
		validateParameter('file', 'The file parameter is required', params, reject);
	}

	/* Code */
	function validateRequiredFlow(params, reject){
		validateParameter('flow', 'The flow parameter is required', params, reject);
	}

	/* Context */
	function validateRequiredState(params, reject){
		validateParameter('state', 'The state parameter is required', params, reject);
	}

	/* Misc */
	function validateRequiredId(params, reject){
		validateParameter('id', 'The id is required', params, reject);
	}

	function validateRequiredData(params, reject){
		validateParameter('data', 'The data parameter is required', params, reject);
	}

	function validateParameter(name, msg, params, reject){
		if( !params[name] ){
			reject(Error(msg));
			return;
		}
	}

	function validateLoggedIn(reject){
		if( !services.auth.isLoggedIn() ){
			var msg = 'BridgeIt is not logged in, cancelling op';
			console.log(msg);
			reject(msg);
		}
	}

	function getTransactionURLParam(){
		var txId = services.getLastTransactionId();
		if( txId ){
			return 'tx=' + txId;
		}
		else{
			return '';
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

	function callGlobalFunctionByName(name, params){
		if( name in window && typeof window[name] === 'function'){
			window[name](params);
		}
	}

	if (!b['services']) {
		b.services = {};

	}

	var services = b.services;

	//internal keys
	var tokenKey = 'bridgeitToken';
	var tokenExpiresKey = 'bridgeitTokenExpires';
	var tokenSetKey = 'bridgeitTokenSet';
	var connectSettingsKey = 'bridgeitConnectSettingsKey';
	var lastActiveTimestampKey = 'bridgeitLastActiveTimestamp';
	var accountKey = 'bridgeitAccount';
	var realmKey = 'bridgeitRealm';
	var usernameKey = 'bridgeitUsername';
	var passwordKey = 'bridgeitPassword';
	var reloginCallbackKey = 'bridgeitReloginCallback';
	var transactionKey = 'bridgeitTransaction';
	
	b.$ = {

		serializePostData: function(data){
			//TODO
		},

		get: function(url){
			return new Promise(
				function(resolve, reject) {
					var request = new XMLHttpRequest();
					request.open('GET', url, true);
					request.onreadystatechange = function() {
						if (this.readyState === 4) {
							if (this.status >= 200 && this.status < 400) {
								resolve(this.responseText);
							} else {
								reject(extractResponseValues(this));
							}
						}
					};
					request.send();
					request = null;
				}
			);
		},

		getJSON: function(url){
			return new Promise(
				function(resolve, reject) {
					var request = new XMLHttpRequest();
					request.open('GET', url, true);
					request.onreadystatechange = function() {
						if (this.readyState === 4) {
							if (this.status >= 200 && this.status < 400) {
								resolve(JSON.parse(this.responseText));
							} else {
								reject(extractResponseValues(this));
							}
						}
					};
					request.send();
					request = null;
				}
			);
		},

		getBlob: function(url){
			return new Promise(
				function(resolve, reject){
					var request = new XMLHttpRequest();
					request.onreadystatechange = function(){
						if (this.readyState === 4 && this.status === 200){
							resolve(new Uint8Array(this.response));
						}
						else{
							reject(extractResponseValues(this));
						}
					};
					request.open('GET', url);
					request.responseType = 'arraybuffer';
					request.send();
					request = null;
				}
			);
		},

		post: function(url, data, isFormData, contentType){
			return new Promise(
				function(resolve, reject) {
					console.log('sending post to ' + url);
					contentType = contentType || "application/json";
					var request = new XMLHttpRequest();
					request.open('POST', url, true);
					request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
					if( !isFormData ){
						request.setRequestHeader("Content-type", contentType);
					}
					//request.setRequestHeader("Connection", "close");
					request.onreadystatechange = function() {
						if (this.readyState === 4) {
							if (this.status >= 200 && this.status < 400) {
								if( this.responseText ){
									var json = null;
									try{
										json = JSON.parse(this.responseText);
										resolve(json);
									}
									catch(e){
										reject(extractResponseValues(this));
									}
								}
								else{
									resolve();
								}
							} else {
								reject(extractResponseValues(this));
							}
						}
					};
					if( data ){
						request.send(isFormData ? data : JSON.stringify(data));
					}
					else{
						request.send();
					}
					
					request = null;
				}
			);
		},

		doDelete: function(url){
			return new Promise(
				function(resolve, reject) {
					console.log('sending delete to ' + url);
					var request = new XMLHttpRequest();
					//request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
					request.open('DELETE', url, true);
					//request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
					//request.setRequestHeader("Content-type", "application/json");
					//request.setRequestHeader("Connection", "close");
					request.onreadystatechange = function() {
						if (this.readyState === 4) {
							if (this.status >= 200 && this.status < 400) {
								services.auth.updateLastActiveTimestamp();
								resolve();
							} else {
								reject(extractResponseValues(this));
							}
						}
					};
					request.send();
					request = null;
				}
			);
		},

		newUUID: function()  {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
				return v.toString(16);
			});
		}

		
	};

	services.configureHosts = function(url){
		var isLocal = ['localhost','127.0.0.1'].indexOf(url) > -1;
		if( !url ){
			services.baseURL = 'dev.bridgeit.io';
		}
		else{
			services.baseURL = url;
		}
		var baseURL = services.baseURL;
		services.authURL = baseURL + (isLocal ? ':55010' : '') + '/auth';
		services.authAdminURL = baseURL + (isLocal ? ':55010' : '') + '/authadmin';
		services.locateURL = baseURL + (isLocal ? ':55020' : '') + '/locate';
		services.documentsURL = baseURL + (isLocal ? ':55080' : '') + '/docs';
		services.storageURL = baseURL + (isLocal ? ':55030' : '') + '/storage';
		services.metricsURL = baseURL + (isLocal ? ':55040' : '') + '/metrics';
		services.contextURL = baseURL + (isLocal ? ':55060' : '') + '/context';
		services.codeURL = baseURL + '/coden';
	};

	services.checkHost = function(params){
		//TODO use last configured host if available
		if( params.host ){
			services.configureHosts(params.host);
		}
	};

	services.startTransaction = function(){
		sessionStorage.setItem(btoa(transactionKey), b.$.newUUID());
		console.log('bridgeit: started transaction ' + bridgeit.services.getLastTransactionId());
	};

	services.endTransaction = function(){
		sessionStorage.removeItem(btoa(transactionKey));
		console.log('bridgeit: ended transaction ' + bridgeit.services.getLastTransactionId());
	};

	services.getLastTransactionId = function(){
		return sessionStorage.getItem(btoa(transactionKey));
	};

	services.admin = {
		
		/**
		 * Get the BridgeIt Service definitions.
		 *
		 * @alias getServiceDefinitions
		 * @param {Object} params params
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns Promise with a json object of the service definitions
		 *
		 */
		getServiceDefinitions: function(params){
			return new Promise(
				function(resolve, reject) {
					if( !params ){
						params = {};
					}
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var token = validateAndReturnRequiredAccessToken(params, reject);
					var protocol = params.ssl ? 'https://' : 'http://';
					var txParam = getTransactionURLParam();
					var url = protocol + services.authAdminURL + '/system/services/?access_token=' + token +
						(txParam ? '&' + txParam : '');

					b.$.getJSON(url).then(function(json){
						services.auth.updateLastActiveTimestamp();
						resolve(json);
					})['catch'](function(error){
						reject(error);
					});
			
				}
			);
		},

		getRealmUsers: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					
					var url = getRealmResourceURL(b.services.authAdminURL, account, realm, 
						'users', token, params.ssl);

					b.$.getJSON(url).then(function(json){
						services.auth.updateLastActiveTimestamp();
						resolve(json);
					})['catch'](function(error){
						reject(error);
					});
			
				}
			);
		},

		getRealmUser: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					validateRequiredUsername(params, reject);
					
					var url = getRealmResourceURL(b.services.authAdminURL, account, realm, 
						'users/' + params.username, token, params.ssl);

					b.$.getJSON(url).then(function(json){
						services.auth.updateLastActiveTimestamp();
						resolve(json);
					})['catch'](function(error){
						reject(error);
					});
			
				}
			);
		},

		getAccountRealms: function(params){
			return new Promise(
				function(resolve, reject) {
					if( !params ){
						params = {};
					}
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					
					var protocol = params.ssl ? 'https://' : 'http://';
					var url = protocol + b.services.authAdminURL + '/' + account + '/realms/'
							+ '?access_token=' + token + getTransactionURLParam();

					b.$.getJSON(url).then(function(json){
						services.auth.updateLastActiveTimestamp();
						resolve(json);
					})['catch'](function(error){
						reject(error);
					});
			
				}
			);
		},

		getAccountRealm: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					var account = validateAndReturnRequiredAccount(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					
					var url = getRealmResourceURL(b.services.authAdminURL, account, realm, 
						'', token, params.ssl);


					b.$.getJSON(url).then(function(json){
						services.auth.updateLastActiveTimestamp();
						resolve(json);
					})['catch'](function(error){
						reject(error);
					});
			
				}
			);
		}
	};

	/* AUTH SERVICE */
	services.auth = {

		/**
		 * Retrieve a new access token from the BridgeIt auth service.
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
		 * @alias getNewAccessToken
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.username User name (required)
		 * @param {String} params.password User password (required)
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns Promise with the following argument:
		 *      {
		 *          access_token: 'xxx',
		 *          expires_in: 99999
		 *      }
		 *
		 */
		 getNewAccessToken: function(params){
			return new Promise(
				function(resolve, reject) {
					b.services.checkHost(params);

					if( !params.realm ){
						params.realm = 'admin';
					}
					
					//validation
					if( !params.account ){
						reject(Error('BridgeIt account required for new access token'));
						return;
					}
					if( !params.password ){
						reject(Error('password required for new access token'));
						return;
					}
					if( !params.username ){
						reject(Error('username required for new access token'));
						return;
					}
					var protocol = params.ssl ? 'https://' : 'http://';
					var url = protocol + b.services.authURL + '/' + encodeURI(params.account) + 
						'/realms/' + encodeURI(params.realm) + '/token/?' + getTransactionURLParam();

					b.$.post(url, {
						strategy: 'query', 
						username: params.username, 
						password: params.password
					}).then(function(authResponse){
												resolve(authResponse);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		/**
		 * Login into bridgeit services. 
		 *
		 * This function will login into the BridgeIt auth service and return a user token and expiry timestamp upon 
		 * successful authentication. This function does not need to be called if bridgeit.connect has already been
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
		 * @alias login
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.username User name (required)
		 * @param {String} params.password User password (required)
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns Promise with the following argument:
		 *      {
		 *          access_token: 'xxx',
		 *          expires_in: 99999
		 *      }
		 *
		 */
		login: function(params) {
			return new Promise(
				function(resolve, reject) {
					b.services.checkHost(params);

					if( !params.realm ){
						params.realm = 'admin';
					}
					
					//validation
					if( !params.account ){
						reject(Error('BridgeIt account required for login'));
						return;
					}
					if( !params.password ){
						reject(Error('password required for login'));
						return;
					}
					if( !params.username ){
						reject(Error('username required for login'));
						return;
					}
					var protocol = params.ssl ? 'https://' : 'http://';
					var url = protocol + b.services.authURL + '/' + encodeURI(params.account) + 
						'/realms/' + encodeURI(params.realm) + '/token/?' + getTransactionURLParam();

					var loggedInAt = new Date().getTime();
					b.$.post(url, {
						strategy: 'query', 
						username: params.username, 
						password: params.password
					}).then(function(authResponse){
						if( !params.suppressUpdateTimestamp ){
							services.auth.updateLastActiveTimestamp();
						}
						sessionStorage.setItem(btoa(tokenKey), authResponse.access_token);
						sessionStorage.setItem(btoa(tokenExpiresKey), authResponse.expires_in);
						sessionStorage.setItem(btoa(tokenSetKey), loggedInAt);
						sessionStorage.setItem(btoa(accountKey), btoa(params.account));
						sessionStorage.setItem(btoa(realmKey), btoa(params.realm));

						resolve(authResponse);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		/**
		 * Connect to bridgeit services. 
		 *
		 * This function will connect to the BridgeIt services, and maintain the connection for the specified 
		 * timeout period (default 20 minutes). By default, the BridgeIt push service is also activated, so the client
		 * may send and receive push notifications after connecting.
		 *
		 * After connecting to BridgeIt Services, any BridgeIt service API may be used without needing to re-authenticate.
		 * After successfully connection an authentication will be stored in session storage and available through 
		 * sessionStorage.bridgeitToken. This authentication information will automatically be used by other BridgeIt API
		 * calls, so the token does not be included in subsequent calls, but is available if desired.
		 *
		 * A simple example of connecting to the BridgeIt Services and then making a service call is the following:
		 *
		 * bridgeit.connect({
		 *           account: 'my_account', 
		 *           realm: 'realmA', 
		 *           user: 'user', 
		 *           password: 'secret'})
		 *   .then( function(){
		 *      console.log("successfully connnected to BridgeIt Services");
		 *      //now we can fetch some docs
		 *      return bridgeit.docService.get('documents');
		 *   })
		 *   .then( function(docs){
		 *      for( var d in docs ){ ... };
		 *   })
		 *   .catch( function(error){
		 *      console.log("error connecting to BridgeIt Services: " + error);
		 *   });
		 *
		 * @alias connect
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name
		 * @param {String} params.realm BridgeIt Services realm
		 * @param {String} params.username User name
		 * @param {String} params.password User password
		 * @param {String} params.host The BridgeIt Services host url, defaults to api.bridgeit.io
		 * @param {Boolean} params.usePushService Open and connect to the BridgeIt push service, default true
		 * @param {Boolean} params.connectionTimeout The timeout duration, in minutes, that the BridgeIt login will last during inactivity. Default 20 minutes.
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @param {Boolean} params.storeCredentials (default true) Whether to store encrypted credentials in session storage. If set to false, bridgeit will not attempt to relogin before the session expires.
		 * @param {Function} params.onSessionTimeout Function callback to be called on session expiry
		 * @returns Promise with service definitions
		 *
		 */
		connect: function(params){
			return new Promise(
				function(resolve, reject) {

					function initConnectCallback(){

						function connectCallback(){
							console.log('bridgeit connect: callback running')
							var connectSettings = services.auth.getConnectSettings();
							if( !connectSettings ){
								console.log('bridgeit connect: error, could not retrieve settings');
							}

							var timeoutMillis =  connectSettings.connectionTimeout * 60 * 1000;	

							//first check if connectionTimeout has expired
							var now = new Date().getTime();
							if( now - services.auth.getLastActiveTimestamp() < timeoutMillis - timeoutPadding ){
								console.log('bridgeit connect: timeout has not been exceeded, ' + services.auth.getTimeRemainingBeforeExpiry()/1000/60 + ' mins remaining');

								if( connectSettings.connectionTimeout > services.auth.getTimeRemainingBeforeExpiry()){
									
									var loginParams = services.auth.getConnectSettings();
									loginParams.account = atob(sessionStorage.getItem(btoa(accountKey)));
									loginParams.realm = atob(sessionStorage.getItem(btoa(realmKey)));
									loginParams.username = atob(sessionStorage.getItem(btoa(usernameKey)));
									loginParams.password = atob(sessionStorage.getItem(btoa(passwordKey)));
									loginParams.suppressUpdateTimestamp = true;

									services.auth.login(loginParams).then(function(authResponse){
										setTimeout(connectCallback, services.auth.getTimeRemainingBeforeExpiry() - timeoutPadding);
									})['catch'](function(response){
										throw new Error('bridgeit connect: error relogging in: ' + response.responseText);
									});
								}
								else{
									console.log('bridgeit connect: setting callback for ' + connectSettings.connectionTimeout + ' minutes');
									setTimeout(connectCallback, connectSettings.connectionTimeout * 60 * 1000);
								}

								
							}
							else{
								console.log('bridgeit connect: timeout has expired, disconnecting..');
								services.auth.disconnect();

								//look for the onSessionTimeout callback on the params first,
								//as functions could be passed by reference
								//secondly by settings, which would only be passed by name
								var expiredCallback = params.onSessionTimeout;
								if( !expiredCallback ){
									expiredCallback = connectSettings.onSessionTimeout;
								}

								if( expiredCallback ){
									if( typeof params.onSessionTimeout === 'function'){
										params.onSessionTimeout();
									}
									else{
										callGlobalFunctionByName()
									}
								}	
							}
						}

						var callbackTimeout;

						//if the desired connection timeout is greater the token expiry
						//set the callback check for just before the token expires
						if( connectionTimeoutMillis > services.auth.getExpiresIn()){
							callbackTimeout = services.auth.getExpiresIn() - 500;
						}
						//otherwise the disired timeout is less then the token expiry
						//so set the callback to happen just at specified timeout
						else{
							callbackTimeout = connectionTimeoutMillis;
						}

						console.log('bridgeit connect: setting timeout to ' + callbackTimeout / 1000 / 60 + ' mins');
						var cbId = setTimeout(connectCallback, callbackTimeout);
						sessionStorage.setItem(btoa(reloginCallbackKey), cbId);
					}

					var timeoutPadding = 500;
					
					services.checkHost(params);
					if( !'storeCredentials' in params){
						params.storeCredentials = true;
					}

					//store connect settings
					var settings = {
						host: services.baseURL,
						userPushService: params.usePushService,
						connectionTimeout: params.connectionTimeout || 20,
						ssl: params.ssl,
						storeCredentials: params.storeCredentials || true,
						onSessionTimeout: params.onSessionTimeout
					};
					sessionStorage.setItem(btoa(connectSettingsKey), btoa(JSON.stringify(settings)));

					if( params.onSessionTimeout ){
						if( typeof params.onSessionTimeout === 'function'){
							var name = getFunctionName(params.onSessionTimeout);
							if( name ){
								settings.onSessionTimeout = name;
							}
						}
					}

					var connectionTimeoutMillis =  settings.connectionTimeout * 60 * 1000;	

					if( services.auth.isLoggedIn()){
						initConnectCallback();
						resolve();
					}
					else{
						services.auth.login(params).then(function(authResponse){
							console.log('bridgeit connect: received auth response');				
							sessionStorage.setItem(btoa(accountKey), btoa(params.account));
							sessionStorage.setItem(btoa(realmKey), btoa(params.realm));
							sessionStorage.setItem(btoa(usernameKey), btoa(params.username));
							sessionStorage.setItem(btoa(passwordKey), btoa(params.password));
							initConnectCallback();	
							resolve();
						})['catch'](function(error){
							reject(error);
						});
					}
				}
			);

		},

		/**
		 * Disconnect from BridgeIt Services.
		 *
		 * This function will logout from BridgeIt Services and remove all session information from the client.
		 *
		 * TODO
		 *
		 * @alias disconnect
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.username User name (required)
		 * @param {String} params.password User password (required)
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns Promise with the following argument:
		 *      {
		 *          access_token: 'xxx',
		 *          expires_in: 99999
		 *      }
		 *
		 */
		disconnect: function(){
			sessionStorage.removeItem(btoa(tokenKey));
			sessionStorage.removeItem(btoa(tokenExpiresKey));
			sessionStorage.removeItem(btoa(connectSettingsKey));
			sessionStorage.removeItem(btoa(tokenSetKey));
			sessionStorage.removeItem(btoa(accountKey));
			sessionStorage.removeItem(btoa(realmKey));
			sessionStorage.removeItem(btoa(usernameKey));
			sessionStorage.removeItem(btoa(passwordKey));
			sessionStorage.removeItem(btoa(lastActiveTimestampKey));
			var cbId = sessionStorage.getItem(btoa(reloginCallbackKey));
			if( cbId ){
				clearTimeout(cbId);
			}
			sessionStorage.removeItem(btoa(reloginCallbackKey));
		},

		getLastAccessToken: function(){
			return sessionStorage.getItem(btoa(tokenKey));
		},

		getExpiresIn: function(){
			var expiresInStr = sessionStorage.getItem(btoa(tokenExpiresKey));
			if( expiresInStr ){
				return parseInt(expiresInStr,10);
			}
		},

		getTokenSetAtTime: function(){
			var tokenSetAtStr = sessionStorage.getItem(btoa(tokenSetKey));
			if( tokenSetAtStr ){
				return parseInt(tokenSetAtStr,10);
			}
		},

		getTimeRemainingBeforeExpiry: function(){
			var expiresIn = services.auth.getExpiresIn();
			var token = services.auth.getExpiresIn();
			if( expiresIn && token ){
				var now = new Date().getTime();
				return (services.auth.getTokenSetAtTime() + expiresIn) - now;
			}
		},

		getConnectSettings: function(){
			var settingsStr = sessionStorage.getItem(btoa(connectSettingsKey));
			if( settingsStr ){
				return JSON.parse(atob(settingsStr));
			}
		},

		isLoggedIn: function(){
			var token = sessionStorage.getItem(btoa(tokenKey)),
				tokenExpiresInStr = sessionStorage.getItem(btoa(tokenExpiresKey)),
				tokenExpiresIn = tokenExpiresInStr ? parseInt(tokenExpiresInStr,10) : null,
				tokenSetAtStr = sessionStorage.getItem(btoa(tokenSetKey)),
				tokenSetAt = tokenSetAtStr ? parseInt(tokenSetAtStr,10) : null,
				result = token && tokenExpiresIn && tokenSetAt && (new Date().getTime() < (tokenExpiresIn + tokenSetAt) );
			return !!result;
		},

		getLastKnownAccount: function(){
			var accountCipher = sessionStorage.getItem(btoa(accountKey));
			if( accountCipher ){
				return atob(accountCipher);
			}
		},

		getLastKnownRealm: function(){
			var realmCipher = sessionStorage.getItem(btoa(realmKey));
			if( realmCipher ){
				return atob(realmCipher);
			}
		},

		/**
		 * Register a new user for a realm that supports open user registrations.
		 *
		 * @alias registerAsNewUser
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required)
		 * @param {String} params.username User name (required)
		 * @param {String} params.password User password (required)
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @param {String} params.firstname The user's first name (optional)
		 * @param {String} params.lastname The user's last name (optional)
		 * @param {String} params.email The user's email (optional)
		 * @param {Object} params.custom Custom user information
		 * @returns Promise 
		 */
		 registerAsNewUser: function(params){
			return new Promise(
				function(resolve, reject) {
					b.services.checkHost(params);

					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);

					validateRequiredUsername(params, reject);
					validateRequiredPassword(params, reject);

					var user = {
						username: params.username,
						password: params.password
					};

					if( 'firstname' in params ){
						user.firstname = params.firstname;
					}
					if( 'lastname' in params ){
						user.lastname = params.lastname;
					}
					if( 'email' in params ){
						user.email = params.email;
					}
					if( 'custom' in params ){
						user.custom = params.custom;
					}

					var url = getRealmResourceURL(b.services.authAdminURL, account, realm, 
						'quickuser', services.auth.getLastAccessToken(), params.ssl);

					b.$.post(url, {user: user}).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		/**
		 * Check if the current user has a set of permissions.
		 *
		 * @alias checkUserPermissions 
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required)
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @param {String} params.permissions A space-delimited list of permissions
		 * @returns Promise 
		 */
		 checkUserPermissions: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					validateRequiredPermissions(params, reject);

					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);

					var url = getRealmResourceURL(b.services.authURL, account, realm, 
						'permission', token, params.ssl);

					b.$.post(url, {permissions: params.permissions}).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(true);
					})['catch'](function(response){
						if( response.status == 403){
							services.auth.updateLastActiveTimestamp();
							resolve(false);
						}
						else{
							reject(error);
						}
					});
				}
			);
		},

		updateLastActiveTimestamp: function(){
			sessionStorage.setItem(btoa(lastActiveTimestampKey), new Date().getTime());
		},
		getLastActiveTimestamp: function(){
			return sessionStorage.getItem(btoa(lastActiveTimestampKey));
		}

	};

	/* DOC SERVICE */
	services.documents = {

		/**
		 * Create a new document
		 *
		 * @alias createDocument
		 * @param {Object} params params
		 * @param {String} params.id The document id. If not provided, the service will return a new id
		 * @param {Object} params.document The document to be created
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {String} The resource URI
		 */
		createDocument: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);

					var url = getRealmResourceURL(b.services.documentsURL, account, realm, 
						'documents/' + (params.id ? params.id : ''), token, params.ssl);

					b.$.post(url, params.document).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response.uri);
					})['catch'](function(error){
						reject(error);
					});
			
				}
			);			
		},

		/**
		 * Update a document
		 *
		 * @alias createDocument
		 * @param {Object} params params
		 * @param {String} params.id The document id. 
		 * @param {Object} params.document The document to be created
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {String} The resource URI
		 */
		updateDocument: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					validateRequiredId(params, reject);

					var url = getRealmResourceURL(b.services.documentsURL, account, realm, 
						'documents/' + params.id, token, params.ssl);

					b.$.post(url, params.document).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response.uri);
					})['catch'](function(error){
						reject(error);
					});
				}
			);			
		},

		/**
		 * Fetch a document
		 *
		 * @alias getDocument
		 * @param {Object} params params
		 * @param {String} params.id The document id. If not provided, the service will return a new id
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {Object} The document
		 */
		 getDocument: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					validateRequiredId(params, reject);

					var url = getRealmResourceURL(b.services.documentsURL, account, realm, 
						'documents/' + params.id, token, params.ssl);

					b.$.getJSON(url).then(function(doc){
						services.auth.updateLastActiveTimestamp();
						//the document service always returns a list, so 
						//check if we have a list of one, and if so, return the single item
						if( doc.length && doc.length === 1 ){
							resolve(doc[0]);
						}
						else{
							resolve(doc);
						}	
					})['catch'](function(error){
						reject(error);
					});
				}
			);			
		},

		/**
		 * Fetch a document
		 *
		 * @alias getDocument
		 * @param {Object} params params
		 * @param {String} params.query A mongo query for the documents
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {Object} The results
		 */
		 findDocuments: function(params){
			return new Promise(
				function(resolve, reject) {

					if( !params ){
						params = {};
					}
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					var queryStr;
					if( params.query ){
						try{
							queryStr = JSON.stringify(params.query);
						}
						catch(e){
							queryStr = params.query;
						}
					}

					var url = getRealmResourceURL(b.services.documentsURL, account, realm, 
						'documents', token, params.ssl, {
							'query': params.query ? encodeURIComponent(queryStr) : ''
					});

					b.$.getJSON(url).then(function(doc){
						services.auth.updateLastActiveTimestamp();
						resolve(doc);
					})['catch'](function(response){
						//service currently returns a 404 when no documents are found
						if( response.status == 404 ){
							resolve(null);
						}
						else{
							reject(error);
						}
					});
			
				}
			);			
		},

		/**
		 * Delete a new document
		 *
		 * @alias deleteDocument
		 * @param {Object} params params
		 * @param {String} params.id The document id. If not provided, the service will return a new id
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 */
		deleteDocument: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					validateRequiredId(params, reject);

					var url = getRealmResourceURL(b.services.documentsURL, account, realm, 
						'documents/' + params.id, token, params.ssl);

					b.$.doDelete(url).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve();
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		}

	};

	/* LOCATE SERVICE */
	services.location = {

		/**
		 * Create a new region
		 *
		 * @alias createRegion
		 * @param {Object} params params
		 * @param {String} params.id The region id. If not provided, the service will return a new id
		 * @param {Object} params.region The region geoJSON document that describes the region to be created
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {String} The resource URI
		 */
		 createRegion: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					validateRequiredRegion(params, reject);

					var url = getRealmResourceURL(services.locateURL, account, realm, 
						'regions/' + (params.id ? params.id : ''), token, params.ssl);


					b.$.post(url, params.region).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response.uri);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		/**
		 * Delete a new region
		 *
		 * @alias deleteRegion
		 * @param {Object} params params
		 * @param {String} params.id The region id. 
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 */
		 deleteRegion: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					validateRequiredId(params, reject);

					var url = getRealmResourceURL(services.locateURL, account, realm, 
						'regions/' + params.id, token, params.ssl);

					b.$.doDelete(url).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve();
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		/**
		 * Fetches all saved regions for the realm
		 *
		 * @alias getAllRegions
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {Object} The results
		 */
		 getAllRegions: function(params){
			return new Promise(
				function(resolve, reject) {

					if( !params ){
						params = {};
					}
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);

					var url = getRealmResourceURL(services.locateURL, account, realm, 
						'regions', token, params.ssl);

					b.$.getJSON(url).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		/**
		 * Searches for regions in a realm based on a query
		 *
		 * @alias findRegions
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @param {Object} params.query The query
		 * @returns {Object} The results
		 */
		 findRegions: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);

					var url = getRealmResourceURL(services.locateURL, account, realm, 
						'regions', token, params.ssl, params.query ? {
							'query': encodeURIComponent(JSON.stringify(params.query))
						}: undefined);

					b.$.getJSON(url).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		/**
		 * Searches for monitors in a realm based on a query
		 *
		 * @alias findMonitors
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {Object} The results
		 */
		 findMonitors: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);

					var url = getRealmResourceURL(services.locateURL, account, realm, 
						'monitors', token, params.ssl, params.query ? {
							'query': encodeURIComponent(JSON.stringify(params.query))
						}: undefined);

					b.$.getJSON(url).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		/**
		 * Create a new location monitor
		 *
		 * @alias createMonitor
		 * @param {Object} params params
		 * @param {String} params.id The monitor id. If not provided, the service will return a new id
		 * @param {Object} params.monitor The monitor document that describes the monitor to be created
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {String} The resource URI
		 */
		 createMonitor: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					validateRequiredMonitor(params, reject);

					var url = getRealmResourceURL(services.locateURL, account, realm, 
						'monitors' + (params.id ? '/' + params.id : ''), token, params.ssl);

					b.$.post(url, params.monitor).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response.uri);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		/**
		 * Delete a new monitor
		 *
		 * @alias deleteMonitor
		 * @param {Object} params params
		 * @param {String} params.id The region id. 
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 */
		 deleteMonitor: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					validateRequiredId(params, reject);

					var url = getRealmResourceURL(services.locateURL, account, realm, 
						'monitors/' + params.id, token, params.ssl);

					b.$.doDelete(url).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve();
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		/**
		 * Fetches all saved monitors for the realm
		 *
		 * @alias getAllMonitors
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {Object} The results
		 */
		 getAllMonitors: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);

					var url = getRealmResourceURL(services.locateURL, account, realm, 
						'monitors', token, params.ssl);

					b.$.getJSON(url).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		/**
		 * Create a new location point of interest
		 *
		 * @alias createPOI
		 * @param {Object} params params
		 * @param {String} params.id The POI id. If not provided, the service will return a new id
		 * @param {Object} params.poi The POI document that describes the POI to be created
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {String} The resource URI
		 */
		 createPOI: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					validateRequiredPOI(params, reject);

					var url = getRealmResourceURL(services.locateURL, account, realm, 
						'poi' + (params.id ? '/' + params.id : ''), token, params.ssl);

					b.$.post(url, params.poi).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response.uri);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		/**
		 * Searches for POIs in a realm based on a query
		 *
		 * @alias findPOIs
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @params {Object} params.query The mongo db query
		 * @returns {Object} The results
		 */
		 findPOIs: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);

					var url = getRealmResourceURL(services.locateURL, account, realm, 
						'poi', token, params.ssl, params.query ? {

						} : undefined);

					b.$.getJSON(url).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		/**
		 * Delete a new POI
		 *
		 * @alias deletePOI
		 * @param {Object} params params
		 * @param {String} params.id The POI id. 
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 */
		 deletePOI: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					validateRequiredId(params, reject);

					var url = getRealmResourceURL(services.locateURL, account, realm, 
						'poi/' + params.id, token, params.ssl);

					b.$.doDelete(url).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve();
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		/**
		 * Fetches all saved POIs for the realm
		 *
		 * @alias getAllPOIs
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {Object} The results
		 */
		 getAllPOIs: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);

					var url = getRealmResourceURL(services.locateURL, account, realm, 
						'poi', token, params.ssl);

					b.$.getJSON(url).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		/**
		 * Update the location of the current user.
		 *
		 * @alias updateLocation
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @param {Object} params.location The location
		 */
		 updateLocation: function(params){
			return new Promise(
				function(resolve, reject) {

					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					validateRequiredLocation(params, reject);
					
					var url = getRealmResourceURL(services.locateURL, account, realm, 
						'locations', token, params.ssl);

					b.$.post(url, params.location).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		/**
		 * Set the current users location with a latitude and longitude
		 *
		 * @alias updateLocationCoordinates
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @param {Number} params.latitude The location latitude
		 * @param {Number} params.longitude The location longitude
		 * @param {String} params.label An optional label
		 */
		 updateLocationCoordinates: function(params){
			return new Promise(
				function(resolve, reject) {

					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					validateRequiredLat(params, reject);
					validateRequiredLon(params, reject);

					var location = {
						location: {
							geometry: {
								type: 'Point',
								coordinates: [ params.lon, params.lat ]
							},
							properties: {
								timestamp: new Date().toISOString()
							}
						}
					};

					if( params.label ){
						location.label = params.label;
					}
					
					var url = getRealmResourceURL(services.locateURL, account, realm, 
						'locations', token, params.ssl);

					b.$.post(url, location).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},


		/**
		 * Get the last known user location from the location service.
		 *
		 * @alias getLastUserLocation
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @param {String} params.username
		 * @returns {Object} The single result, if any, of the user location.
		 

		 http://dev.bridgeit.io/locate/bsrtests/realms/test/locations
		 	?access_token=4be2fc2f-a53b-4987-9446-88d519faaa77
		 	&query={%22username%22:%22user%22}
		 	&options={%22sort%22:[[%22lastUpdated%22,%22desc%22]]}
		 	&results=one

		 var locationURL = apiURL + '/locations' +
                    '?access_token=' + encodeURIComponent(bsr.auth.getCurrentToken()) +
                    '&query={"username": "' + encodeURIComponent(user) + '"} +' +
                    '&options={"sort":[["lastUpdated","desc"]]}' +
                    '&results=one';
         */

		 getLastUserLocation: function(params){
			return new Promise(
				function(resolve, reject) {

					validateRequiredUsername(params, reject);
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					
					var url = getRealmResourceURL(services.locateURL, account, realm, 
						'locations', token, params.ssl, {
							'query': {username: encodeURIComponent(params.username)},
							'options': '{"sort":[["lastUpdated","desc"]]}',
							'results':'one'
						});

					b.$.getJSON(url).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response);
					})['catch'](function(reponse){
						if( response.status == 403 ){
							resolve(null);
						}
						else{
							reject(response);
						}
					});
				}
			);
		}

		
	};

	/* METRICS SERVICE */
	services.metrics = {

		/**
		 * Searches for Metrics in a realm based on a query
		 *
		 * @alias findMetrics
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.expression The expression for the metrics query TODO document expression format
		 * @param {String} params.start The start date for events. Represented in ISO 8601 UTC format (YYYY-MM-DDTHH:mm:ss.sssZ); defaults to UNIX epoch. TODO convert from other formats
		 * @param {String} params.stop The stop date for events. Represented in ISO 8601 UTC format (YYYY-MM-DDTHH:mm:ss.sssZ); defaults to now.
		 * @param {Number} params.limit The maximum number of events to return; defaults to ten thousand
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {Object} The results
		 */
		findMetrics: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);

					var queryParams = {};
					if( params.expression ){
						queryParams.expression = encodeURIComponent(params.expression);
					}
					if( params.start ){
						queryParams.start = encodeURIComponent(params.start)
					}
					if( params.stop ){
						queryParams.stop = encodeURIComponent(params.stop);
					}
					if( params.limit ){
						queryParams.limit = params.limit;
					}
					var url = getRealmResourceURL(services.metricsURL, account, realm, 
						'stats', token, params.ssl, queryParams);

					b.$.getJSON(url).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		/**
		 * Store a custom metric in the metrics service.
		 *
		 * @alias addMetric
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @param {Object} params.metric The custom metric that you would like to store, in JSON format.
		 * @param {String} params.type The metric 'type'
		 */
		 addCustomMetric: function(params){
			return new Promise(
				function(resolve, reject) {
					console.log('addCustomMetric()');
					validateRequiredMetric(params, reject);
					validateRequiredType(params, reject);

					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);

					var url = getRealmResourceURL(services.metricsURL, account, realm, 
						'stats', token, params.ssl);


					var postData = {
						auth: {
							agent: {
								access_token: token,
								account: account, 
								realm: realm, 
								type: params.type
							}
						},
						data: params.metric
					};
					console.log('addCustomMetric() sending post');
					b.$.post(url, postData).then(function(){
						services.auth.updateLastActiveTimestamp();
						resolve();
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		/**
		 * Retrieve the time difference in milliseconds between the provided time and the metrics server time.
		 *
		 * Useful for displaying accurate live metrics views. The time difference is returned as 
		 * client time - server time.
		 *
		 * @alias getClientServerTimeGap
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {Number} The time difference in milliseconds
		 */
		 getClientServerTimeGap: function(params){
			return new Promise(
				function(resolve, reject) {

					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);

					var url = getRealmResourceURL(services.metricsURL, account, realm, 
						'time', token, params.ssl, {
							clientTime: encodeURIComponent(new Date().toISOString())
						});

					b.$.getJSON(url).then(function(response){
						if( response.timeDifference){
							services.auth.updateLastActiveTimestamp();
							resolve(response.timeDifference);
						}
						else{
							reject(new Error('getClientServerTimeGap() could not parse response: ' + 
								JSON.stringify(response)));
						}
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		}


	};

	/* CONTEXT SERVICE */
	services.context = {

		getUser: function(params){
			return new Promise(
				function(resolve, reject) {

					validateRequiredUsername(params, reject);
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);

					var url = getRealmResourceURL(services.contextURL, account, realm, 
						'users/' + params.username, token, params.ssl);

					b.$.getJSON(url).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		getUserState: function(params){
			return new Promise(
				function(resolve, reject) {

					validateRequiredUsername(params, reject);
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);

					var url = getRealmResourceURL(services.contextURL, account, realm, 
						'users/' + params.username + '/state', token, params.ssl);

					b.$.getJSON(url).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		setUserState: function(params){
			return new Promise(
				function(resolve, reject) {

					validateRequiredUsername(params, reject);
					validateRequiredState(params, reject);
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);

					var url = getRealmResourceURL(services.contextURL, account, realm, 
						'users/' + params.username + '/state', token, params.ssl);

					b.$.post(url, params.state).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		getUserInfo: function(params){
			return new Promise(
				function(resolve, reject) {

					validateRequiredUsername(params, reject);
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);

					var url = getRealmResourceURL(services.contextURL, account, realm, 
						'users/' + params.username + '/info', token, params.ssl);

					b.$.getJSON(url).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		getUpdates: function(params){
			return new Promise(
				function(resolve, reject) {

					validateRequiredUsername(params, reject);
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);

					var url = getRealmResourceURL(services.contextURL, account, realm, 
						'users/' + params.username + '/updates', token, params.ssl);

					b.$.getJSON(url).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		getUnreadUpdates: function(params){
			return new Promise(
				function(resolve, reject) {

					validateRequiredUsername(params, reject);
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);

					var url = getRealmResourceURL(services.contextURL, account, realm, 
						'users/' + params.username + '/updates/unread', token, params.ssl);

					b.$.getJSON(url).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		executeContext: function(params){
			return new Promise(
				function(resolve, reject) {

					validateRequiredData(params, reject);

					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);

					var url = getRealmResourceURL(services.contextURL, account, realm, 
						'contexts', token, params.ssl, {
							op: 'exec'
						});

					b.$.post(url, params.data).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		}

	};

	/* CODE SERVICE */
	services.code = {

		/**
		 * Executes a code flow
		 *
		 * @alias executeFlow
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @param {String} params.httpMethod (default 'post') 'get' or 'post'
		 * @param {String} params.flow The code flow name
		 * @param {Object} params.data The data to send with the flow
		 */
		executeFlow: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					var httpMethod = params.httpMethod || 'post';
					httpMethod = httpMethod.toLowerCase();

					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					validateRequiredFlow(params, reject);

					var url = getRealmResourceURL(services.codeURL, account, realm, 
						'nodes/' + encodeURI(params.flow), token, params.ssl);

					if( 'get' === httpMethod ){
						//TODO encode params.data into URL?
						b.$.get(url).then(function(response){
							services.auth.updateLastActiveTimestamp();
							resolve();
						})['catch'](function(error){
							reject(error);
						});
					}
					else if( 'post' === httpMethod ){
						b.$.post(url, params.data).then(function(response){
							services.auth.updateLastActiveTimestamp();
							resolve();
						})['catch'](function(error){
							reject(error);
						});
					}
					
				}
			);
		},

		start: function(params){
			return new Promise(
				function(resolve, reject) {

					if( !params ){
						params = {};
					}
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					
					http://dev.bridgeit.io/coden/bridget_u/realms/bridgeit.u?access_token=xxxx

					var url = getRealmResourceURL(services.codeURL, account, realm, 
						'', token, params.ssl);

					b.$.post(url).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve();
					})['catch'](function(error){
						reject(error);
					});
					
				}
			);
		},

		stop: function(params){
			return new Promise(
				function(resolve, reject) {

					if( !params ){
						params = {};
					}
					
					services.checkHost(params);
					validateLoggedIn(reject);

					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					
					http://dev.bridgeit.io/coden/bridget_u/realms/bridgeit.u?access_token=xxxx

					var url = getRealmResourceURL(services.codeURL, account, realm, 
						'', token, params.ssl);

					b.$.doDelete(url).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve();
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		restart: function(params){
			return services.code.stop(params).then(function(){
				return services.code.start(params);
			});
		}
	}

	/* STORAGE SERVICE */
	services.storage = {

		/**
		 * Retrieve the storage meta info for the realm
		 *
		 * @alias getMetaInfo
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {Object} The results
		 */
		getMetaInfo: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);

					var url = getRealmResourceURL(services.storageURL, account, realm, 
						'meta', token, params.ssl, {
							scope: 'all'
						});


					b.$.getJSON(url).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		/**
		 * Stores a blob
		 *
		 * @alias uploadBlob
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.id The blob id. If not provided, the service will return a new id
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Object} params.blob The Blob to store
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {Object} The results
		 */
		uploadBlob: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					validateRequiredBlob(params, reject);

					var formData = new FormData();
					formData.append('file', params.blob);

					var url = getRealmResourceURL(services.storageURL, account, realm, 
						'blobs' + (params.id ? '/' + params.id : ''), token, params.ssl);

					b.$.post(url, formData, true).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response.uri);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		/**
		 * Stores a file 
		 *
		 * @alias uploadBlob
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.id The blob id. If not provided, the service will return a new id
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Object} params.file The Blob to store
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {Object} The results
		 */
		uploadFile: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					validateRequiredFile(params, reject);

					var url = getRealmResourceURL(services.storageURL, account, realm, 
						'blobs' + (params.id ? '/' + params.id : ''), token, params.ssl);
					var formData = new FormData();
					formData.append('file', params.blob);

					b.$.post(url, formData, true).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response.uri);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		/**
		 * Retrieves a blob file from the storage service
		 *
		 * @alias getBlob
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.id The blob id. 
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {Object} The blob arraybuffer
		 */
		getBlob: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					validateRequiredId(params, reject);

					var url = getRealmResourceURL(services.storageURL, account, realm, 
						'blobs/' + params.id, token, params.ssl);

					b.$.getBlob(url).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve(response);
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		},

		/**
		 * Deletes a blob file from the storage service
		 *
		 * @alias deleteBlob
		 * @param {Object} params params
		 * @param {String} params.account BridgeIt Services account name (required)
		 * @param {String} params.realm BridgeIt Services realm (required only for non-admin logins)
		 * @param {String} params.id The blob id. 
		 * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.services.auth.connect() will be used
		 * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 */
		deleteBlob: function(params){
			return new Promise(
				function(resolve, reject) {
					
					services.checkHost(params);
					validateLoggedIn(reject);
					
					//validate
					var account = validateAndReturnRequiredAccount(params, reject);
					var realm = validateAndReturnRequiredRealm(params, reject);
					var token = validateAndReturnRequiredAccessToken(params, reject);
					validateRequiredId(params, reject);

					var url = getRealmResourceURL(services.storageURL, account, realm, 
						'blobs/' + params.id, token, params.ssl);

					b.$.doDelete(url).then(function(response){
						services.auth.updateLastActiveTimestamp();
						resolve();
					})['catch'](function(error){
						reject(error);
					});
				}
			);
		}
	};

	/* Initialization */
	services.configureHosts();

	/* check connect settings */
	if( services.auth.isLoggedIn()){
		var connectSettings = services.auth.getConnectSettings();
		if( connectSettings ){
			//user is logged in and has connect settings, so reconnect
			services.auth.connect(connectSettings);
		}
	}
	
	

	
})(bridgeit);