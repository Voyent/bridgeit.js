(function(b) {
	
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

	/************************* Private ********************/

	/* Auth */
	function validateRequiredAccount(params, reject){
		if( !params.account ){
			reject(Error('BridgeIt account is required'));
			return;
		}
	}

	function validateRequiredRealm(params, reject){
		if( !params.realm ){
			reject(Error('BridgeIt realm is required'));
			return;
		}
	}

	function validateRequiredAccessToken(reject){
		if( !b.services.auth.getAccessToken() ){
			reject(Error('BridgeIt access token is required'));
			return;
		}
	}

	/* Locate */
	function validateRequiredRegion(params, reject){
		if( !params.region ){
			reject(Error('The region parameter is required'));
			return;
		}
	}

	function validateRequiredMonitor(params, reject){
		if( !params.monitor ){
			reject(Error('The monitor parameter is required'));
			return;
		}
	}

	function validateRequiredPOI(params, reject){
		if( !params.poi ){
			reject(Error('The poi parameter is required'));
			return;
		}
	}

	/* Misc */
	function validateRequiredId(params, reject){
		if( !params.id ){
			reject(Error('The id is required'));
			return;
		}
	}

	b.$ = {

		serializePostData: function(data){
			//TODO
		},

		getJSON: function(url, done, fail){

			return new Promise(
				function(resolve, reject) {
					var request = new XMLHttpRequest();
					request.open('GET', url, true);
					request.onreadystatechange = function() {
						if (this.readyState === 4) {
							if (this.status >= 200 && this.status < 400) {
						  		resolve(JSON.parse(this.responseText));
							} else {
						  		reject(Error(this.status));
							}
						}
					};
					request.send();
					request = null;
				}
			);
			
		},

		post: function(url, data){
			return new Promise(
				function(resolve, reject) {
					console.log('sending post to ' + url);
					var request = new XMLHttpRequest();
					//request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
					request.open('POST', url, true);
					//request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
					request.setRequestHeader("Content-type", "application/json");
   					//request.setRequestHeader("Connection", "close");
					request.onreadystatechange = function() {
						if (this.readyState === 4) {
							if (this.status >= 200 && this.status < 400) {
								var json = null;
								try{
									json = JSON.parse(this.responseText);
									resolve(json);
								}
								catch(e){
									reject(e);
								}
							} else {
						  		reject(Error(this.status));
							}
						}
					};
					request.send(JSON.stringify(data));
					request = null;
				}
			);
		},

		delete: function(url){
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
								resolve();
							} else {
						  		reject(Error(this.status));
							}
						}
					};
					request.send();
					request = null;
				}
			);
		},

		updateLastActiveTimestamp: function(){
			sessionStorage.setItem(btoa(lastActiveTimestampKey), new Date().getTime());
		},
		getLastActiveTimestamp: function(){
			sessionStorage.getItem(btoa(lastActiveTimestampKey));
		}
	};

	services.configureHosts = function(url){
		var isLocal = url == 'localhost' || '127.0.0.1';
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
	};

	services.checkHost = function(params){
		//TODO use last configured host if available
		if( params.host ){
			services.configureHosts(params.host);
		}
	};

	

	
	

	/* AUTH SERVICE */
	services.auth = {

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
		 * @param {String} params.host The BridgeIt Services host url, defaults to api.bridgeit.io (optional)
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
					var url = protocol + b.services.authURL + '/' + encodeURI(params.account) + '/realms/' + encodeURI(params.realm) + '/token/';

					b.$.post(url, {strategy: 'query', username: params.username, password: params.password})
						.then(
							function(response){
								resolve(response);
							}
						)
						.catch(
							function(error){
								reject(error);
							}
						);
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
		 * @param {Boolean} params.admin Whether the user is an admin (default false), (if true, 'realm' is ignored)
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
					
					//defaults
					b.services.checkHost(params);
					if( !'storeCredentials' in params){
						params.storeCredentials = true;
					}

					//store connect settings
					var settings = {
						host: services.baseURL,
						userPushService: params.usePushService,
						connectionTimeout: params.connectionTimeout || 20,
						ssl: params.ssl,
						storeCredentials: params.storeCredentials,
						onSessionTimeout: params.onSessionTimeout
					};
					sessionStorage.setItem(btoa(connectSettingsKey), btoa(JSON.stringify(settings)));
					

					console.log('connect logging in');
					var loggedInAt = new Date().getTime();
					services.auth.login(params)
						.then(function(authResponse){
							console.log('connect received auth response: ' + JSON.stringify(authResponse));

							b.$.updateLastActiveTimestamp();

							sessionStorage.setItem(btoa(tokenKey), authResponse.access_token);
							sessionStorage.setItem(btoa(tokenExpiresKey), authResponse.expires_in);
							sessionStorage.setItem(btoa(tokenSetKey), loggedInAt);

							//store creds
							if( params.storeCredentials ){
								
								sessionStorage.setItem(btoa(accountKey), btoa(params.account));
								sessionStorage.setItem(btoa(realmKey), btoa(params.realm));
								sessionStorage.setItem(btoa(usernameKey), btoa(params.username));
								sessionStorage.setItem(btoa(passwordKey), btoa(params.password));

								function reloginBeforeTimeout(){
									//first check if connectionTimeout has expired
									var now = new Date().getTime();
									if( now - b.$.getLastActiveTimestamp() < params.connectionTimeout * 60 * 1000 ){
										//we have not exceeded the connection timeout
										var loginParams = services.auth.getConnectSettings();
										loginParams.account = sessionStorage.getItem(btoa(accountKey));
										loginParams.realm = sessionStorage.getItem(btoa(realmKey));
										loginParams.username = sessionStorage.getItem(btoa(usernameKey));
										loginParams.password = sessionStorage.getItem(btoa(passwordKey));

										services.auth.login(loginParams)
											.then(function(authResponse){
												setTimeout(reloginBeforeTimeout, authResponse.expires_in - 200);
											})
											.catch(function(error){
												throw new Error('error relogging in: ' + error);
											});

									}
								}
								//set a timeout for 200 ms before expires to attempt to relogin
								setTimeout(reloginBeforeTimeout, authResponse.expires_in - 200);
								
							}
							resolve(authResponse);
						})
						.catch(function(error){
							reject(error);
						});
					
					
				}
			);

		},

		disconnect: function(){
			//TODO
		},

		getAccessToken: function(){
			return sessionStorage.getItem(btoa(tokenKey));
		},

		getExpiresIn: function(){
			return sessionStorage.getItem(btoa(tokenExpiresKey));
		},

		getTimeRemainingBeforeExpiry: function(){
			var expiresIn = services.auth.getExpiresIn();
			var token = services.auth.getExpiresIn();
			if( expiresIn && token ){
				var loggedInAt = sessionStorage.getItem(btoa(tokenSetKey));
				var now = new Date().getTime();
				return (loggedInAt + expiresIn) - now;
			}
		},

		getConnectSettings: function(){
			var settingsStr = sessionStorage.getItem(btoa(connectSettingsKey));
			if( settingsStr ){
				return JSON.parse(settingsStr);
			}
		},

		isLoggedIn: function(){
			var token = sessionStorage.getItem(btoa(tokenKey)),
				tokenExpiresStr = sessionStorage.getItem(btoa(tokenExpiresKey)),
				tokenExpires = tokenExpiresStr ? parseInt(tokenExpiresStr) : null,
				expiresIn = tokenExpires ? tokenExpires - new Date().getTime() : null,
				result = expiresIn > 0;
			return result;
		}
	};

	/* DOC SERVICE */
	b.services.documents = {

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
		 * @param {String} params.host The BridgeIt Services host url, defaults to api.bridgeit.io (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {String} The resource URI
		 */
		createDocument: function(params){
			return new Promise(
				function(resolve, reject) {
					//defaults
					b.services.checkHost(params);

					//validate
					validateRequiredAccount(params, reject);
					validateRequiredRealm(params, reject);
					validateRequiredAccessToken(reject);

					var protocol = params.ssl ? 'https://' : 'http://';
					var url = protocol + b.services.documentsURL + '/' + encodeURI(params.account) + 
						'/realms/' + encodeURI(params.realm) + '/documents/' + (params.id ? params.id : '') + 
						'?access_token=' + b.services.auth.getAccessToken();

					b.$.post(url, params.document)
						.then(
							function(response){
								resolve(response.uri);
							}
						)
						.catch(
							function(error){
								reject(error);
							}
						);
			
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
		 * @param {String} params.host The BridgeIt Services host url, defaults to api.bridgeit.io (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {String} The resource URI
		 */
		updateDocument: function(params){
			return new Promise(
				function(resolve, reject) {
					//defaults
					b.services.checkHost(params);

					//validate
					validateRequiredAccount(params, reject);
					validateRequiredRealm(params, reject);
					validateRequiredAccessToken(reject);
					validateRequiredId(params, reject);

					var protocol = params.ssl ? 'https://' : 'http://';
					var url = protocol + b.services.documentsURL + '/' + encodeURI(params.account) + 
						'/realms/' + encodeURI(params.realm) + '/documents/' + params.id + 
						'?access_token=' + b.services.auth.getAccessToken();

					b.$.post(url, params.document)
						.then(
							function(response){
								resolve(response.uri);
							}
						)
						.catch(
							function(error){
								reject(error);
							}
						);
			
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
		 * @param {String} params.host The BridgeIt Services host url, defaults to api.bridgeit.io (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {Object} The document
		 */
		 getDocument: function(params){
			return new Promise(
				function(resolve, reject) {
					//defaults
					b.services.checkHost(params);

					//validate
					validateRequiredAccount(params, reject);
					validateRequiredRealm(params, reject);
					validateRequiredAccessToken(reject);
					validateRequiredId(params, reject);

					var protocol = params.ssl ? 'https://' : 'http://';
					var url = protocol + b.services.documentsURL + '/' + encodeURI(params.account) + 
						'/realms/' + encodeURI(params.realm) + '/documents/' + params.id + 
						'?access_token=' + b.services.auth.getAccessToken();

					b.$.getJSON(url)
						.then(
							function(doc){
								//the document service always returns a list, so 
								//check if we have a list of one, and if so, return the single item
								if( doc.length && doc.length === 1 ){
									resolve(doc[0]);
								}
								else{
									resolve(doc);
								}	
							}
						)
						.catch(
							function(error){
								reject(error);
							}
						);
			
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
		 * @param {String} params.host The BridgeIt Services host url, defaults to api.bridgeit.io (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {Object} The results
		 */
		 findDocuments: function(params){
			return new Promise(
				function(resolve, reject) {
					//defaults
					b.services.checkHost(params);

					//validate
					validateRequiredAccount(params, reject);
					validateRequiredRealm(params, reject);
					validateRequiredAccessToken(reject);

					var protocol = params.ssl ? 'https://' : 'http://';
					var url = protocol + b.services.documentsURL + '/' + encodeURI(params.account) + 
						'/realms/' + encodeURI(params.realm) + '/documents/?' + 
						(params.query ? 'query=' + encodeURIComponent(JSON.stringify(params.query)) : '') + 
						'&access_token=' + b.services.auth.getAccessToken();

					b.$.getJSON(url)
						.then(
							function(doc){
								resolve(doc);
							}
						)
						.catch(
							function(error){
								reject(error);
							}
						);
			
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
		 * @param {String} params.host The BridgeIt Services host url, defaults to api.bridgeit.io (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {String} The resource URI
		 */
		deleteDocument: function(params){
			return new Promise(
				function(resolve, reject) {
					//defaults
					b.services.checkHost(params);

					//validate
					validateRequiredAccount(params, reject);
					validateRequiredRealm(params, reject);
					validateRequiredAccessToken(reject);
					validateRequiredId(params, reject);

					var protocol = params.ssl ? 'https://' : 'http://';
					var url = protocol + b.services.documentsURL + '/' + encodeURI(params.account) + 
						'/realms/' + encodeURI(params.realm) + '/documents/' + params.id + 
						'?access_token=' + b.services.auth.getAccessToken();

					b.$.delete(url)
						.then(
							function(response){
								resolve();
							}
						)
						.catch(
							function(error){
								reject(error);
							}
						);
			
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
		 * @param {String} params.host The BridgeIt Services host url, defaults to api.bridgeit.io (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {String} The resource URI
		 */
		 createRegion: function(params){
			return new Promise(
				function(resolve, reject) {
					//defaults
					b.services.checkHost(params);

					//validate
					validateRequiredAccount(params, reject);
					validateRequiredRealm(params, reject);
					validateRequiredAccessToken(reject);
					validateRequiredRegion(params, reject);

					var protocol = params.ssl ? 'https://' : 'http://';
					var url = protocol + b.services.locateURL + '/' + encodeURI(params.account) + 
						'/realms/' + encodeURI(params.realm) + '/regions/' + (params.id ? params.id : '') + 
						'?access_token=' + b.services.auth.getAccessToken();

					b.$.post(url, params.region)
						.then(
							function(response){
								resolve(response.uri);
							}
						)
						.catch(
							function(error){
								reject(error);
							}
						);
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
		 * @param {String} params.host The BridgeIt Services host url, defaults to api.bridgeit.io (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {String} The resource URI
		 */
		 deleteRegion: function(params){
			return new Promise(
				function(resolve, reject) {
					//defaults
					b.services.checkHost(params);

					//validate
					validateRequiredAccount(params, reject);
					validateRequiredRealm(params, reject);
					validateRequiredAccessToken(reject);
					validateRequiredId(params, reject);

					var protocol = params.ssl ? 'https://' : 'http://';
					var url = protocol + b.services.locateURL + '/' + encodeURI(params.account) + 
						'/realms/' + encodeURI(params.realm) + '/regions/' + params.id + 
						'?access_token=' + b.services.auth.getAccessToken();

					b.$.delete(url)
						.then(
							function(response){
								resolve();
							}
						)
						.catch(
							function(error){
								reject(error);
							}
						);
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
		 * @param {String} params.host The BridgeIt Services host url, defaults to api.bridgeit.io (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {Object} The results
		 */
		 getAllRegions: function(params){
			return new Promise(
				function(resolve, reject) {
					//defaults
					b.services.checkHost(params);

					//validate
					validateRequiredAccount(params, reject);
					validateRequiredRealm(params, reject);
					validateRequiredAccessToken(reject);

					var protocol = params.ssl ? 'https://' : 'http://';
					var url = protocol + b.services.locateURL + '/' + encodeURI(params.account) + 
						'/realms/' + encodeURI(params.realm) + '/regions/' +  
						'?access_token=' + b.services.auth.getAccessToken();

					b.$.getJSON(url)
						.then(
							function(response){
								resolve(response);
							}
						)
						.catch(
							function(error){
								reject(error);
							}
						);
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
		 * @param {String} params.host The BridgeIt Services host url, defaults to api.bridgeit.io (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {Object} The results
		 */
		 findRegions: function(params){
			return new Promise(
				function(resolve, reject) {
					//defaults
					b.services.checkHost(params);

					//validate
					validateRequiredAccount(params, reject);
					validateRequiredRealm(params, reject);
					validateRequiredAccessToken(reject);

					var protocol = params.ssl ? 'https://' : 'http://';
					var url = protocol + services.locateURL + '/' + encodeURI(params.account) + 
						'/realms/' + encodeURI(params.realm) + '/regions/?' + 
						(params.query ? 'query=' + encodeURIComponent(JSON.stringify(params.query)) : '') +
						'&access_token=' + services.auth.getAccessToken();

					b.$.getJSON(url)
						.then(
							function(response){
								resolve(response);
							}
						)
						.catch(
							function(error){
								reject(error);
							}
						);
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
		 * @param {String} params.host The BridgeIt Services host url, defaults to api.bridgeit.io (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {Object} The results
		 */
		 findMonitors: function(params){
			return new Promise(
				function(resolve, reject) {
					//defaults
					b.services.checkHost(params);

					//validate
					validateRequiredAccount(params, reject);
					validateRequiredRealm(params, reject);
					validateRequiredAccessToken(reject);

					var protocol = params.ssl ? 'https://' : 'http://';
					var url = protocol + services.locateURL + '/' + encodeURI(params.account) + 
						'/realms/' + encodeURI(params.realm) + '/monitors/?' + 
						(params.query ? 'query=' + encodeURIComponent(JSON.stringify(params.query)) : '') +
						'&access_token=' + services.auth.getAccessToken();

					b.$.getJSON(url)
						.then(
							function(response){
								resolve(response);
							}
						)
						.catch(
							function(error){
								reject(error);
							}
						);
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
		 * @param {String} params.host The BridgeIt Services host url, defaults to api.bridgeit.io (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {String} The resource URI
		 */
		 createMonitor: function(params){
			return new Promise(
				function(resolve, reject) {
					//defaults
					b.services.checkHost(params);

					//validate
					validateRequiredAccount(params, reject);
					validateRequiredRealm(params, reject);
					validateRequiredAccessToken(reject);
					validateRequiredMonitor(params, reject);

					var protocol = params.ssl ? 'https://' : 'http://';
					var url = protocol + b.services.locateURL + '/' + encodeURI(params.account) + 
						'/realms/' + encodeURI(params.realm) + '/monitors/' + (params.id ? params.id : '') + 
						'?access_token=' + b.services.auth.getAccessToken();

					b.$.post(url, params.monitor)
						.then(
							function(response){
								resolve(response.uri);
							}
						)
						.catch(
							function(error){
								reject(error);
							}
						);
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
		 * @param {String} params.host The BridgeIt Services host url, defaults to api.bridgeit.io (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {String} The resource URI
		 */
		 deleteMonitor: function(params){
			return new Promise(
				function(resolve, reject) {
					//defaults
					b.services.checkHost(params);

					//validate
					validateRequiredAccount(params, reject);
					validateRequiredRealm(params, reject);
					validateRequiredAccessToken(reject);
					validateRequiredId(params, reject);

					var protocol = params.ssl ? 'https://' : 'http://';
					var url = protocol + b.services.locateURL + '/' + encodeURI(params.account) + 
						'/realms/' + encodeURI(params.realm) + '/monitors/' + params.id + 
						'?access_token=' + b.services.auth.getAccessToken();

					b.$.delete(url)
						.then(
							function(response){
								resolve();
							}
						)
						.catch(
							function(error){
								reject(error);
							}
						);
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
		 * @param {String} params.host The BridgeIt Services host url, defaults to api.bridgeit.io (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {Object} The results
		 */
		 getAllMonitors: function(params){
			return new Promise(
				function(resolve, reject) {
					//defaults
					b.services.checkHost(params);

					//validate
					validateRequiredAccount(params, reject);
					validateRequiredRealm(params, reject);
					validateRequiredAccessToken(reject);

					var protocol = params.ssl ? 'https://' : 'http://';
					var url = protocol + b.services.locateURL + '/' + encodeURI(params.account) + 
						'/realms/' + encodeURI(params.realm) + '/monitors/' +  
						'?access_token=' + b.services.auth.getAccessToken();

					b.$.getJSON(url)
						.then(
							function(response){
								resolve(response);
							}
						)
						.catch(
							function(error){
								reject(error);
							}
						);
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
		 * @param {String} params.host The BridgeIt Services host url, defaults to api.bridgeit.io (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {String} The resource URI
		 */
		 createPOI: function(params){
			return new Promise(
				function(resolve, reject) {
					//defaults
					b.services.checkHost(params);

					//validate
					validateRequiredAccount(params, reject);
					validateRequiredRealm(params, reject);
					validateRequiredAccessToken(reject);
					validateRequiredPOI(params, reject);

					var protocol = params.ssl ? 'https://' : 'http://';
					var url = protocol + b.services.locateURL + '/' + encodeURI(params.account) + 
						'/realms/' + encodeURI(params.realm) + '/poi/' + (params.id ? params.id : '') + 
						'?access_token=' + b.services.auth.getAccessToken();

					b.$.post(url, params.poi)
						.then(
							function(response){
								resolve(response.uri);
							}
						)
						.catch(
							function(error){
								reject(error);
							}
						);
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
		 * @param {String} params.host The BridgeIt Services host url, defaults to api.bridgeit.io (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {Object} The results
		 */
		 findPOIs: function(params){
			return new Promise(
				function(resolve, reject) {
					//defaults
					b.services.checkHost(params);

					//validate
					validateRequiredAccount(params, reject);
					validateRequiredRealm(params, reject);
					validateRequiredAccessToken(reject);

					var protocol = params.ssl ? 'https://' : 'http://';
					var url = protocol + services.locateURL + '/' + encodeURI(params.account) + 
						'/realms/' + encodeURI(params.realm) + '/poi/?' + 
						(params.query ? 'query=' + encodeURIComponent(JSON.stringify(params.query)) : '') +
						'&access_token=' + services.auth.getAccessToken();

					b.$.getJSON(url)
						.then(
							function(response){
								resolve(response);
							}
						)
						.catch(
							function(error){
								reject(error);
							}
						);
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
		 * @param {String} params.host The BridgeIt Services host url, defaults to api.bridgeit.io (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {String} The resource URI
		 */
		 deletePOI: function(params){
			return new Promise(
				function(resolve, reject) {
					//defaults
					b.services.checkHost(params);

					//validate
					validateRequiredAccount(params, reject);
					validateRequiredRealm(params, reject);
					validateRequiredAccessToken(reject);
					validateRequiredId(params, reject);

					var protocol = params.ssl ? 'https://' : 'http://';
					var url = protocol + b.services.locateURL + '/' + encodeURI(params.account) + 
						'/realms/' + encodeURI(params.realm) + '/poi/' + params.id + 
						'?access_token=' + b.services.auth.getAccessToken();

					b.$.delete(url)
						.then(
							function(response){
								resolve();
							}
						)
						.catch(
							function(error){
								reject(error);
							}
						);
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
		 * @param {String} params.host The BridgeIt Services host url, defaults to api.bridgeit.io (optional)
		 * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
		 * @returns {Object} The results
		 */
		 getAllPOIs: function(params){
			return new Promise(
				function(resolve, reject) {
					//defaults
					b.services.checkHost(params);

					//validate
					validateRequiredAccount(params, reject);
					validateRequiredRealm(params, reject);
					validateRequiredAccessToken(reject);

					var protocol = params.ssl ? 'https://' : 'http://';
					var url = protocol + b.services.locateURL + '/' + encodeURI(params.account) + 
						'/realms/' + encodeURI(params.realm) + '/poi/' +  
						'?access_token=' + b.services.auth.getAccessToken();

					b.$.getJSON(url)
						.then(
							function(response){
								resolve(response);
							}
						)
						.catch(
							function(error){
								reject(error);
							}
						);
				}
			);
		},

	};

	/* METRICS SERVICE */
	b.services.metrics = {};

	/* STORAGE SERVICE */
	b.services.storage = {};

	/* Initialization */
	b.services.configureHosts();
	
})(bridgeit);