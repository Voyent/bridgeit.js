function ContextService(b, utils) {
    function validateRequiredState(params, reject){
        utils.validateParameter('state', 'The state parameter is required', params, reject);
    }
    var services = b.io;

    return {

        getUser: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);
                    var username = utils.validateAndReturnRequiredUsername(params, reject);

                    var url = getRealmResourceURL(services.contextURL, account, realm,
                        'users/' + username, token, params.ssl);

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
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);
                    var username = utils.validateAndReturnRequiredUsername(params, reject);

                    var url = getRealmResourceURL(services.contextURL, account, realm,
                        'users/' + username + '/state', token, params.ssl);

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
                    params = params ? params : {};
                    validateRequiredState(params, reject);

                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);
                    var username = utils.validateAndReturnRequiredUsername(params, reject);

                    var url = getRealmResourceURL(services.contextURL, account, realm,
                        'users/' + username + '/state', token, params.ssl);

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
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);
                    var username = utils.validateAndReturnRequiredUsername(params, reject);

                    var url = getRealmResourceURL(services.contextURL, account, realm,
                        'users/' + username + '/info', token, params.ssl);

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
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);
                    var username = utils.validateAndReturnRequiredUsername(params, reject);

                    var url = getRealmResourceURL(services.contextURL, account, realm,
                        'users/' + username + '/updates', token, params.ssl);

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
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);
                    var username = utils.validateAndReturnRequiredUsername(params, reject);

                    var url = getRealmResourceURL(services.contextURL, account, realm,
                        'users/' + username + '/updates/unread', token, params.ssl);

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
                    params = params ? params : {};
                    validateRequiredData(params, reject);

                    services.checkHost(params);

                    //validate
                    var account = validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealm(params, reject);
                    var token = validateAndReturnRequiredAccessToken(params, reject);

                    var url = getRealmResourceURL(services.contextURL, account, realm,
                        'contexts/' + params.name, token, params.ssl, {
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
}
