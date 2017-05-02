function AdminService(v, utils) {
    function validateRequiredUser(params, reject){
        utils.validateParameter('user', 'The user parameter is required', params, reject);
    }

    function validateRequiredRole(params, reject){
        utils.validateParameter('role', 'The role parameter is required', params, reject);
    }

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

                    v.checkHost(params);

                    //validate
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    var protocol = params.ssl ? 'https://' : 'http://';
                    var txParam = utils.getTransactionURLParam();
                    var url = protocol + v.authAdminURL + '/system/v/?access_token=' + token +
                        (txParam ? '&' + txParam : '');

                    v.$.getJSON(url).then(function(json){
                        v.auth.updateLastActiveTimestamp();
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
                v.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var protocol = params.ssl ? 'https://' : 'http://';
                var txParam = utils.getTransactionURLParam();
                var url = protocol + v.authAdminURL + '/' + account + '?access_token=' + token +
                    (txParam ? '&' + txParam : '');

                v.$.getJSON(url).then(function(json){
                    v.auth.updateLastActiveTimestamp();
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
                v.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var protocol = params.ssl ? 'https://' : 'http://';
                var url = protocol + v.authAdminURL + '/' + account + '/realms/'
                    + '?access_token=' + token + utils.getTransactionURLParam();

                v.$.getJSON(url).then(function(json){
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.realms);
                })['catch'](function(error){
                    reject(error);
                });

            });
        },

        getRealm: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var realm = validateAndReturnRequiredRealmName(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    '', token, params.ssl);

                v.$.getJSON(url).then(function(json){
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.realm);
                })['catch'](function(error){
                    reject(error);
                });

            });
        },

        updateRealm: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                validateRequiredRealm(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, params.realm.name,
                    '', token, params.ssl);

                v.$.put(url, {realm: params.realm}).then(function(){
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function(error){
                    reject(error);
                });

            });
        },

        createRealm: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var realmName = validateAndReturnRequiredRealmName(params, reject);
                validateRequiredRealm(params, reject);

                var protocol = params.ssl ? 'https://' : 'http://';
                var txParam = utils.getTransactionURLParam();
                var url = protocol + v.authAdminURL + '/' + account + '/realms?access_token=' + token +
                    (txParam ? '&' + txParam : '');

                v.$.post(url, {realm: params.realm}).then(function(json){
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.resourceLocation);
                })['catch'](function(error){
                    reject(error);
                });

            });
        },

        deleteRealm: function(params){
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var realmName = validateAndReturnRequiredRealmName(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realmName,
                    '', token, params.ssl);

                v.$.doDelete(url).then(function(){
                    v.auth.updateLastActiveTimestamp();
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
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealmName(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                        'users', token, params.ssl);

                    v.$.getJSON(url).then(function(json){
                        v.auth.updateLastActiveTimestamp();
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
                    v.checkHost(params);

                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealmName(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    validateRequiredUser(params, reject);

                    var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                        'users', v.auth.getLastAccessToken(), params.ssl);

                    v.$.post(url, {user: params.user}).then(function(response){
                        v.auth.updateLastActiveTimestamp();
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
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealmName(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    var username = utils.validateAndReturnRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                        'users/' + username, token, params.ssl);

                    v.$.getJSON(url).then(function(json){
                        v.auth.updateLastActiveTimestamp();
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
                    v.checkHost(params);

                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealmName(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    validateRequiredUser(params, reject);

                    var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                        'users/' + params.user.username, v.auth.getLastAccessToken(), params.ssl);

                    v.$.put(url, {user: params.user}).then(function(response){
                        v.auth.updateLastActiveTimestamp();
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
                    v.checkHost(params);

                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealmName(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    utils.validateRequiredUsername(params, reject);

                    var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                        'users/' + params.username, v.auth.getLastAccessToken(), params.ssl);

                    v.$.doDelete(url).then(function(){
                        v.auth.updateLastActiveTimestamp();
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
                    v.checkHost(params);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealmName(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                        'roles', token, params.ssl);

                    v.$.getJSON(url).then(function(json){
                        v.auth.updateLastActiveTimestamp();
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
                    v.checkHost(params);

                    validateRequiredRole(params, reject);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealmName(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                        'roles', token, params.ssl);

                    v.$.post(url, {role: params.role}).then(function(response){
                        v.auth.updateLastActiveTimestamp();
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
                    v.checkHost(params);

                    validateRequiredRole(params, reject);

                    //validate
                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealmName(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                        'roles/' + params.role.name, token, params.ssl);

                    v.$.put(url, {role: params.role}).then(function(response){
                        v.auth.updateLastActiveTimestamp();
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
                    v.checkHost(params);

                    utils.validateRequiredId(params, reject);

                    var account = utils.validateAndReturnRequiredAccount(params, reject);
                    var realm = validateAndReturnRequiredRealmName(params, reject);
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                    var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                        'roles/' + params.id, token, params.ssl);

                    v.$.doDelete(url).then(function(response){
                        v.auth.updateLastActiveTimestamp();
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
                v.checkHost(params);

                var protocol = params.ssl ? 'https://' : 'http://';
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var query = params.query ? encodeURIComponent(JSON.stringify(params.query)) : '{}';
                var fields = params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : '{}';
                var options = params.options ? encodeURIComponent(JSON.stringify(params.options)) : '{}';

                var url = protocol + v.authAdminURL + '/' + account + '/logging/?access_token=' +
                    token + '&query=' + query + '&fields=' + fields + '&options=' + options;

                v.$.getJSON(url).then(function(logs){
                    v.auth.updateLastActiveTimestamp();
                    resolve(logs);
                })['catch'](function(error){
                    reject(error);
                });

            });
        },

        getDebugLogs: function(params) {
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                var protocol = params.ssl ? 'https://' : 'http://';
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var query = params.query ? encodeURIComponent(JSON.stringify(params.query)) : '{}';
                var fields = params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : '{}';
                var options = params.options ? encodeURIComponent(JSON.stringify(params.options)) : '{}';

                var url = protocol + v.authAdminURL + '/' + account + '/realms/' + realm +
                    '/debugLogging/?access_token=' + token + '&query=' + query + '&fields=' + fields + '&options=' + options;

                v.$.getJSON(url).then(function(logs){
                    v.auth.updateLastActiveTimestamp();
                    resolve(logs);
                })['catch'](function(error){
                    reject(error);
                });

            });
        }
    };
}
