function CodeService(b, utils) {
    function validateRequiredFlow(params, reject){
        utils.validateParameter('flow', 'The flow parameter is required', params, reject);
    }

    var services = b.io;

    return {

        /**
         * Executes a code flow
         *
         * @alias executeFlow
         * @param {Object} params params
         * @param {String} params.account BridgeIt Services account name. If not provided, the last known BridgeIt Account will be used.
         * @param {String} params.realm The BridgeIt Services realm. If not provided, the last known BridgeIt Realm name will be used.
         * @param {String} params.accessToken The BridgeIt authentication token. If not provided, the stored token from bridgeit.io.auth.connect() will be used
         * @param {String} params.host The BridgeIt Services host url. If not supplied, the last used BridgeIT host, or the default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {String} params.httpMethod (default 'post') 'get' or 'post'
         * @param {String} params.flow The code flow name
         * @param {Object} params.data The data to send with the flow
         */
        executeFlow: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

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

                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);

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

                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);

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
    };
}