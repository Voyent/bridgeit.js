function ContextService(b, utils) {
    function validateRequiredState(params, reject){
        utils.validateParameter('state', 'The state parameter is required', params, reject);
    }

    function validateRequiredData(params, reject){
        utils.validateParameter('data', 'The data parameter is required', params, reject);
    }

    var services = b.io;

    return {

        getUser: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    var username = utils.validateAndReturnRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(services.contextURL, account, realm,
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
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    var username = utils.validateAndReturnRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(services.contextURL, account, realm,
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
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    var username = utils.validateAndReturnRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(services.contextURL, account, realm,
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
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    var username = utils.validateAndReturnRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(services.contextURL, account, realm,
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
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    var username = utils.validateAndReturnRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(services.contextURL, account, realm,
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
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    var username = utils.validateAndReturnRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(services.contextURL, account, realm,
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
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(services.contextURL, account, realm,
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
