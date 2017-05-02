function CodeService(v, utils) {
    function validateRequiredFlow(params, reject){
        utils.validateParameter('flow', 'The flow parameter is required', params, reject);
    }

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
                    v.checkHost(params);

                    var httpMethod = params.httpMethod || 'post';
                    httpMethod = httpMethod.toLowerCase();

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    validateRequiredFlow(params, reject);

                    var url = utils.getRealmResourceURL(v.codeURL, account, realm,
                        'nodes/' + encodeURI(params.flow), token, params.ssl);

                    if( 'get' === httpMethod ){
                        //TODO encode params.data into URL?
                        v.$.get(url).then(function(response){
                            v.auth.updateLastActiveTimestamp();
                            resolve();
                        })['catch'](function(error){
                            reject(error);
                        });
                    }
                    else if( 'post' === httpMethod ){
                        v.$.post(url, params.data).then(function(response){
                            v.auth.updateLastActiveTimestamp();
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
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.codeURL, account, realm,
                        '', token, params.ssl);

                    v.$.post(url).then(function(response){
                        v.auth.updateLastActiveTimestamp();
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
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.codeURL, account, realm,
                        '', token, params.ssl);

                    v.$.doDelete(url).then(function(response){
                        v.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        restart: function(params){
            return v.code.stop(params).then(function(){
                return v.code.start(params);
            });
        }
    };
}