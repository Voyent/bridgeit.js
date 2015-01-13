(function(b) {
	
	if (!b['services']) {
		b.services = {};
	}

	var services = b.services;

	//Service defaults
	services.tokenKey = 'bridgeitToken';
	services.tokenExpiresKey = 'bridgeitTokenExpires';

	b.util = {

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
						  		resolve(JSON.parse(this.responseText));
							} else {
						  		reject(Error(this.status));
							}
						}
					};
					request.send(JSON.stringify(data));
					request = null;
				}
			);
			
		}
	};

	services.configureHosts = function(url){
		if( !url ){
			services.baseURL = 'dev.bridgeit.io';
		}
		else{
			services.baseURL = url;
		}
		var baseURL = services.baseURL;
		services.authURL = baseURL + '/auth';
		services.authAdminURL = baseURL + '/authadmin';
		services.locateURL = baseURL + '/locate';
		services.documentsURL = baseURL + '/docs';
		services.storageURL = baseURL + '/storage';
		services.metricsURL = baseURL + '/metrics';
	};

	services.checkHost = function(params){
		if( params.host ){
			services.configureHosts(params.host);
		}
	};

	/**
	 * Connect to bridgeit services. 
	 *
	 * This function will connect to the BridgeIt services, and maintain the connection for the specified 
	 * timeout period (default 30 minutes). By default, the BridgeIt push service is also activated, so the client
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
	 * @param {Boolean} params.connectionTimeout The timeout duration, in minutes, that the BridgeIt login will last during inactivity. Default 30 minutes.
	 * @param {Boolean} params.useSecureChannels (default false) Whether to use SSL for network traffic.
	 * @param {Boolean} params.storeCredentials (default true) Whether to store encrypted credentials in session storage. If set to false, attempts to reconnect will depend of the storage of encyrpted credentials in page scope, and refreshing the browser, clearing the credentials, will prevent the client from refreshing an expired authentication token.
	 * @param {Function} params.done Success callback for clients that do not support ES6 Promises
	 * @param {Function} params.fail Failure callback for clients that do not support ES6 Promises
	 * @param {Function} params.onSessionTimeout Function callback to be called on session expiry
	 * @returns Promise with service definitions
	 *
	 */
	services.connect = function(params){

	};

	
	services.disconnect = function(account, realm, username){

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

					b.util.post(url, {strategy: 'query', username: params.username, password: params.password})
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

		getAccessToken: function(){
			return sessionStorage.getItem(btoa(services.tokenKey));
		},

		getExpiresIn: function(){
			return sessionStorage.getItem(btoa(services.tokenExpiresKey));
		}
	};

	/* DOC SERVICE */
	b.services.documents = {};

	/* LOCATE SERVICE */
	b.services.location = {};

	/* METRICS SERVICE */
	b.services.metrics = {};

	/* STORAGE SERVICE */
	b.services.storage = {};

	/* Initialization */
	b.services.configureHosts();
	
})(bridgeit);