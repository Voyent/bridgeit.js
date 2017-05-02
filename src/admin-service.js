function AdminService(b, utils) {
    function validateRequiredUser(params, reject){
        utils.validateParameter('user', 'The user parameter is required', params, reject);
    }

    function validateRequiredRole(params, reject){
        utils.validateParameter('role', 'The role parameter is required', params, reject);
    }

    var services = b.io;

    return {

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
                    params = params ? params : {};

                    services.checkHost(params);

                    //validate
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    var protocol = params.ssl ? 'https://' : 'http://';
                    var txParam = utils.getTransactionURLParam();
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

        getAccount: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                services.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var protocol = params.ssl ? 'https://' : 'http://';
                var txParam = utils.getTransactionURLParam();
                var url = protocol + services.authAdminURL + '/' + account + '?access_token=' + token +
                    (txParam ? '&' + txParam : '');

                b.$.getJSON(url).then(function(json){
                    services.auth.updateLastActiveTimestamp();
                    resolve(json.account);
                })['catch'](function(error){
                    reject(error);
                });

            });
        },

        /* Realm admin */

        getRealms: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                services.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var protocol = params.ssl ? 'https://' : 'http://';
                var url = protocol + services.authAdminURL + '/' + account + '/realms/'
                    + '?access_token=' + token + utils.getTransactionURLParam();

                b.$.getJSON(url).then(function(json){
                    services.auth.updateLastActiveTimestamp();
                    resolve(json.realms);
                })['catch'](function(error){
                    reject(error);
                });

            });
        },

        getRealm: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                services.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var realm = validateAndReturnRequiredRealmName(params, reject);

                var url = utils.getRealmResourceURL(services.authAdminURL, account, realm,
                    '', token, params.ssl);

                b.$.getJSON(url).then(function(json){
                    services.auth.updateLastActiveTimestamp();
                    resolve(json.realm);
                })['catch'](function(error){
                    reject(error);
                });

            });
        },

        updateRealm: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                services.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                validateRequiredRealm(params, reject);

                var url = utils.getRealmResourceURL(services.authAdminURL, account, params.realm.name,
                    '', token, params.ssl);

                b.$.put(url, {realm: params.realm}).then(function(){
                    services.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function(error){
                    reject(error);
                });

            });
        },

        createRealm: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                services.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var realmName = validateAndReturnRequiredRealmName(params, reject);
                validateRequiredRealm(params, reject);

                var protocol = params.ssl ? 'https://' : 'http://';
                var txParam = utils.getTransactionURLParam();
                var url = protocol + services.authAdminURL + '/' + account + '/realms?access_token=' + token +
                    (txParam ? '&' + txParam : '');

                b.$.post(url, {realm: params.realm}).then(function(json){
                    services.auth.updateLastActiveTimestamp();
                    resolve(json.resourceLocation);
                })['catch'](function(error){
                    reject(error);
                });

            });
        },

        deleteRealm: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                services.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var realmName = validateAndReturnRequiredRealmName(params, reject);

                var url = utils.getRealmResourceURL(services.authAdminURL, account, realmName,
                    '', token, params.ssl);

                b.$.doDelete(url).then(function(){
                    services.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function(error){
                    reject(error);
                });

            });
        },

        /* Realm Users */

        getRealmUsers: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealmName(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(services.authAdminURL, account, realm,
                        'users', token, params.ssl);

                    b.$.getJSON(url).then(function(json){
                        services.auth.updateLastActiveTimestamp();
                        resolve(json.users);
                    })['catch'](function(error){
                        reject(error);
                    });

                }
            );
        },

        createRealmUser: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealmName(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    validateRequiredUser(params, reject);

                    var url = utils.getRealmResourceURL(services.authAdminURL, account, realm,
                        'users', services.auth.getLastAccessToken(), params.ssl);

                    b.$.post(url, {user: params.user}).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve(response.resourceLocation);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        getRealmUser: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealmName(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    var username = utils.validateAndReturnRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(services.authAdminURL, account, realm,
                        'users/' + username, token, params.ssl);

                    b.$.getJSON(url).then(function(json){
                        services.auth.updateLastActiveTimestamp();
                        resolve(json.user);
                    })['catch'](function(error){
                        reject(error);
                    });

                }
            );
        },

        updateRealmUser: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealmName(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    validateRequiredUser(params, reject);

                    var url = utils.getRealmResourceURL(services.authAdminURL, account, realm,
                        'users/' + params.user.username, services.auth.getLastAccessToken(), params.ssl);

                    b.$.put(url, {user: params.user}).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        deleteRealmUser: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealmName(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    utils.validateRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(services.authAdminURL, account, realm,
                        'users/' + params.username, services.auth.getLastAccessToken(), params.ssl);

                    b.$.doDelete(url).then(function(){
                        services.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        /* Realm Roles */

        getRealmRoles: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealmName(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(services.authAdminURL, account, realm,
                        'roles', token, params.ssl);

                    b.$.getJSON(url).then(function(json){
                        services.auth.updateLastActiveTimestamp();
                        resolve(json.roles);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        createRealmRole: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    validateRequiredRole(params, reject);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealmName(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(services.authAdminURL, account, realm,
                        'roles', token, params.ssl);

                    b.$.post(url, {role: params.role}).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve(response.resourceLocation);
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        updateRealmRole: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    validateRequiredRole(params, reject);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealmName(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(services.authAdminURL, account, realm,
                        'roles/' + params.role.name, token, params.ssl);

                    b.$.put(url, {role: params.role}).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        deleteRealmRole: function(params){
            return new Promise(
                function(resolve, reject) {
                    params = params ? params : {};
                    services.checkHost(params);

                    utils.validateRequiredId(params, reject);

                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealmName(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(services.authAdminURL, account, realm,
                        'roles/' + params.id, token, params.ssl);

                    b.$.doDelete(url).then(function(response){
                        services.auth.updateLastActiveTimestamp();
                        resolve();
                    })['catch'](function(error){
                        reject(error);
                    });
                }
            );
        },

        getLogs: function(params) {
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                services.checkHost(params);

                var protocol = params.ssl ? 'https://' : 'http://';
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var query = params.query ? encodeURIComponent(JSON.stringify(params.query)) : '{}';
                var fields = params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : '{}';
                var options = params.options ? encodeURIComponent(JSON.stringify(params.options)) : '{}';

                var url = protocol + services.authAdminURL + '/' + account + '/logging/?access_token=' +
                    token + '&query=' + query + '&fields=' + fields + '&options=' + options;

                b.$.getJSON(url).then(function(logs){
                    services.auth.updateLastActiveTimestamp();
                    resolve(logs);
                })['catch'](function(error){
                    reject(error);
                });

            });
        },

        getDebugLogs: function(params) {
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                services.checkHost(params);

                var protocol = params.ssl ? 'https://' : 'http://';
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var query = params.query ? encodeURIComponent(JSON.stringify(params.query)) : '{}';
                var fields = params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : '{}';
                var options = params.options ? encodeURIComponent(JSON.stringify(params.options)) : '{}';

                var url = protocol + services.authAdminURL + '/' + account + '/realms/' + realm +
                    '/debugLogging/?access_token=' + token + '&query=' + query + '&fields=' + fields + '&options=' + options;

                b.$.getJSON(url).then(function(logs){
                    services.auth.updateLastActiveTimestamp();
                    resolve(logs);
                })['catch'](function(error){
                    reject(error);
                });

            });
        }
    };
}
