function ContextService(v, utils) {
    function validateRequiredState(params, reject){
        utils.validateParameter('state', 'The state parameter is required', params, reject);
    }

    function validateRequiredData(params, reject){
        utils.validateParameter('data', 'The data parameter is required', params, reject);
    }

    return {

        getUser: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    var username = utils.validateAndReturnRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(v.contextURL, account, realm,
                        'users/' + username, token, params.ssl);

                    v.$.getJSON(url).then(function(response){
                        v.auth.updateLastActiveTimestamp();
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
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    var username = utils.validateAndReturnRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(v.contextURL, account, realm,
                        'users/' + username + '/state', token, params.ssl);

                    v.$.getJSON(url).then(function(response){
                        v.auth.updateLastActiveTimestamp();
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

                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    var username = utils.validateAndReturnRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(v.contextURL, account, realm,
                        'users/' + username + '/state', token, params.ssl);

                    v.$.post(url, params.state).then(function(response){
                        v.auth.updateLastActiveTimestamp();
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
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    var username = utils.validateAndReturnRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(v.contextURL, account, realm,
                        'users/' + username + '/info', token, params.ssl);

                    v.$.getJSON(url).then(function(response){
                        v.auth.updateLastActiveTimestamp();
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
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    var username = utils.validateAndReturnRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(v.contextURL, account, realm,
                        'users/' + username + '/updates', token, params.ssl);

                    v.$.getJSON(url).then(function(response){
                        v.auth.updateLastActiveTimestamp();
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
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    var username = utils.validateAndReturnRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(v.contextURL, account, realm,
                        'users/' + username + '/updates/unread', token, params.ssl);

                    v.$.getJSON(url).then(function(response){
                        v.auth.updateLastActiveTimestamp();
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

                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = utils.validateAndReturnRequiredRealm(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.contextURL, account, realm,
                        'contexts/' + params.name, token, params.ssl, {
                            op: 'exec'
                        });

                    v.$.post(url, params.data).then(function(response){
                        v.auth.updateLastActiveTimestamp();
                        resolve(response);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        }

    };
}
