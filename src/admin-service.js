function AdminService(v, keys, utils) {
    function validateRequiredUser(params, reject) {
        utils.validateParameter('user', 'The user parameter is required', params, reject);
    }

    function validateRequiredRole(params, reject) {
        utils.validateParameter('role', 'The role parameter is required', params, reject);
    }

    function validateAndReturnRequiredEmail(params, reject) {
        var email = params.email;
        if (email) {
            return email;
        }
        else {
            return reject(Error('The Voyent email parameter is required'));
        }
    }

    function validateAndReturnRequiredFirstname(params, reject) {
        var firstname = params.firstname;
        if (firstname) {
            return firstname;
        }
        else {
            return reject(Error('The Voyent firstname parameter is required'));
        }
    }

    function validateAndReturnRequiredLastname(params, reject) {
        var lastname = params.lastname;
        if (lastname) {
            return lastname;
        }
        else {
            return reject(Error('The Voyent lastname parameter is required'));
        }
    }

    function validateRequiredConfirmationId(params, reject) {
        utils.validateParameter('confirmationId', 'The confirmationId parameter is required', params, reject);
    }

    function validateRequiredAccount(params, reject) {
        utils.validateParameter('account', 'The account parameter is required', params, reject);
    }

    function validateRequiredMetadata(params, reject) {
        utils.validateParameter('metadata', 'The metadata parameter is required', params, reject);
    }

    function validateAndReturnRequiredAdmin(params, reject) {
        var admin = params.admin;
        if (admin) {
            return admin;
        }
        else {
            return reject(Error('The admin parameter is required'));
        }
    }

    function validateAndReturnRequiredOriginRealmName(params, reject) {
        var realm = params.originRealmName;
        if (realm) {
            realm = encodeURI(realm);
        }
        else {
            realm = v.auth.getLastKnownRealm();
        }
        if (realm) {
            return realm;
        }
        else {
            return reject(Error('The Voyent originRealmName is required'));
        }
    }

    function validateAndReturnRequiredDestRealmName(params, reject) {
        var realm = params.destRealmName;
        if (realm) {
            realm = encodeURI(realm);
            return realm;
        }
        else {
            return reject(Error('The Voyent destRealmName is required'));
        }
    }

    return {

        /**
         * Get the Voyent Service definitions.
         *
         * @memberOf voyent.admin
         * @alias getServiceDefinitions
         * @param {Object} params params
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @returns Promise with a json object of the service definitions
         *
         */
        getServiceDefinitions: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    v.checkHost(params);

                    //validate
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    var txParam = utils.getTransactionURLParam();
                    var url = utils.determineProtocol(params.ssl) + v.authAdminURL + '/system/services/?access_token=' + token +
                        (txParam ? '&' + txParam : '');

                    v.$.getJSON(url).then(function (json) {
                        v.auth.updateLastActiveTimestamp();
                        resolve(json);
                    })['catch'](function (error) {
                        reject(error);
                    });

                }
            );
        },

        getAccount: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = utils.determineProtocol(params.ssl) + v.authAdminURL + '/' + account + '?access_token=' + token +
                    (txParam ? '&' + txParam : '');

                v.$.getJSON(url).then(function (json) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.account);
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },

        /**
         * Create a new Voyent Account. After successfully creating the account, the new administrator will
         * be automatically logged in.
         *
         * @memberOf voyent.admin
         * @alias createAccount
         * @param {Object} params params
         * @param {String} params.host The Voyent Services host url. If not supplied, the last used Voyent host, or the
         *     default will be used. (optional)
         * @param {Boolean} params.ssl (default false) Whether to use SSL for network traffic.
         * @param {String} params.account The name of the new account (required)
         * @param {String} params.username The username for the new administrator (required)
         * @param {String} params.email The email of the new administrator (required)
         * @param {String} params.firstname The first name of the new administrator (required)
         * @param {String} params.lastname The last name of the new administrator (required)
         * @param {String} params.password The password of the new administrator (required)
         * @returns Promise with an access token for the new administrator
         *
         */
        createAccount: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                var account = {admins: []};
                var accountname = utils.validateAndReturnRequiredAccount(params, reject);
                account.accountname = accountname;

                if (params.description) {
                    account.description = params.description;
                }

                var admin = {};
                var username = utils.validateAndReturnRequiredUsername(params, reject);
                admin.username = username;
                utils.validateRequiredPassword(params, reject);
                admin.password = params.password;
                admin.email = validateAndReturnRequiredEmail(params, reject);
                admin.firstname = validateAndReturnRequiredFirstname(params, reject);
                admin.lastname = validateAndReturnRequiredLastname(params, reject);

                // Check for email metadata
                // If present we need to mark the admin unconfirmed, and pass the metadata
                if (params.metadata) {
                    admin.unconfirmed = "true";
                    account.metadata = params.metadata;
                }

                // Add our admin user to the list
                account.admins.push(admin);

                // Add custom field(s) if present
                if (params.custom) {
                    account.custom = params.custom;
                }

                var txParam = utils.getTransactionURLParam();
                var url = utils.determineProtocol(params.ssl) + v.authAdminURL + '/' + (txParam ? '&' + txParam : '');
                var loggedInAt = new Date().getTime();
                v.$.post(url, {account: account}).then(function (json) {
                    v.auth.updateLastActiveTimestamp();

                    utils.setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(accountname));
                    utils.setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(username));
                    utils.setSessionStorageItem(btoa(keys.ADMIN_KEY), btoa('true'));
                    if (params.host) {
                        utils.setSessionStorageItem(btoa(keys.HOST_KEY), btoa(params.host));
                    }

                    // May not have a token if the account required email confirmation validation first
                    if (json.token) {
                        utils.setSessionStorageItem(btoa(keys.TOKEN_KEY), json.token.access_token);
                        utils.setSessionStorageItem(btoa(keys.TOKEN_EXPIRES_KEY), json.token.expires_in);
                        utils.setSessionStorageItem(btoa(keys.TOKEN_SET_KEY), loggedInAt);

                        resolve(json.token.access_token);
                    }
                    else {
                        resolve(json);
                    }
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },

        /**
         * Attempt to confirm an account
         * This would happen when a new account (from createAccount) had an email confirmation sent to them
         *
         * @param {Object} params
         * @param {String} params.confirmationId from the email and returned url, used to check
         * @param {String} params.account to validate with
         * @returns Promise containing the response, which if successful will have username available
         */
        confirmAccount: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                // Check confirmationId and account
                validateRequiredConfirmationId(params, reject);
                validateRequiredAccount(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = utils.determineProtocol(params.ssl) + v.authAdminURL + '/' + params.account + '/confirm' + (txParam ? '&' + txParam : '');
                v.$.post(url, {confirmationId: params.confirmationId}).then(function (json) {
                    // Store the returned username, and also the param account and realm if available
                    if (json.username) {
                        utils.setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(json.username));
                    }
                    if (params.account) {
                        utils.setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(params.account));
                    }
                    if (params.realm) {
                        utils.setSessionStorageItem(btoa(keys.REALM_KEY), btoa(params.realm));
                    }

                    resolve(json);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        /**
         * Resend the confirmation email for an account registration
         * This will mark the account unconfirmed/invalid as part of the process
         *
         * @param {Object} params
         * @param {String} params.metadata containing the email template
         * @param {String} params.account to send the email to
         * @param {String} params.username to send the email to
         * @returns Promise containing the response
         */
        resendConfirmAccountEmail: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                // Check metadata, account, and username
                validateRequiredMetadata(params, reject);
                validateRequiredAccount(params, reject);
                utils.validateRequiredUsername(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = utils.determineProtocol(params.ssl) + v.authAdminURL + '/'
                    + params.account + '/admins/'
                    + params.username + '/resendLink'
                    + (txParam ? '&' + txParam : '');
                v.$.post(url, {metadata: params.metadata}).then(function (json) {
                    resolve(json);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        /* Realm admin */

        getRealms: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var url = utils.determineProtocol(params.ssl) + v.authAdminURL + '/' + account + '/realms/'
                    + '?access_token=' + token + '&' + utils.getTransactionURLParam();

                v.$.getJSON(url).then(function (json) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.realms);
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },

        getRealm: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    '', token, params.ssl);

                v.$.getJSON(url).then(function (json) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.realm);
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },

        updateRealm: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateRequiredRealm(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, params.realm.name,
                    '', token, params.ssl);

                v.$.put(url, {realm: params.realm}).then(function () {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },

        createRealm: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateAndReturnRequiredRealmName(params, reject);
                utils.validateRequiredRealm(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = utils.determineProtocol(params.ssl) + v.authAdminURL + '/' + account + '/realms?access_token=' + token +
                    (txParam ? '&' + txParam : '');

                v.$.post(url, {realm: params.realm}).then(function (json) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.resourceLocation);
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },

        cloneRealm: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var originRealmName = validateAndReturnRequiredOriginRealmName(params, reject);
                var destRealmName = validateAndReturnRequiredDestRealmName(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = utils.determineProtocol(params.ssl) + v.authAdminURL + '/' + account + '/realms/' + originRealmName + '/clone/' +
                    destRealmName + '?access_token=' + token + (txParam ? '&' + txParam : '');

                v.$.post(url, {realm: params.realm}).then(function (json) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.resourceLocation);
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },

        deleteRealm: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var realmName = utils.validateAndReturnRequiredRealmName(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realmName,
                    '', token, params.ssl);

                console.log('voyent.admin.deleteRealm() ' + url);

                v.$.doDelete(url).then(function () {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },

        /* Realm Users */

        getRealmUsers: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'users/', token, params.ssl, {
                        'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                        'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                        'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
                    }
                );

                v.$.getJSON(url).then(function (json) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.users);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        createRealmUser: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                validateRequiredUser(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'users', token, params.ssl);

                var toPost = {user: params.user};

                if (params.metadata) {
                    toPost.metadata = params.metadata;
                }

                v.$.post(url, toPost).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(response.resourceLocation);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        /**
         * Attempt to create an anonymous realm user
         *
         * @param {Object} params
         * @param {String} params.account to validate with
         * @param {String} params.realmName to validate with
         * @returns Object with the username and password
         */

        createAnonUser: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'register', false, params.ssl);

                var password = v.auth.generatePassword()
                var toPost = {user: {password: password}};

                if (params.metadata) {
                    toPost.metadata = params.metadata;
                }

                v.$.post(url, toPost).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    var anonUser = {
                        password: password,
                        username: response.resourceLocation.substring(response.resourceLocation.lastIndexOf('/') + 1)
                    };
                    resolve(anonUser);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        /**
         * Attempt to confirm a realm user account
         * This would happen when a new realm user (from createRealmUser) had an email confirmation sent to them
         *
         * @param {Object} params
         * @param {String} params.confirmationId from the email and returned url, used to check
         * @param {String} params.account to validate with
         * @param {String} params.realm to validate with
         * @returns Promise containing the response, which if successful will have username available
         */
        confirmRealmUser: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                // Check confirmationId, account, and realm
                validateRequiredConfirmationId(params, reject);
                validateRequiredAccount(params, reject);
                utils.validateRequiredRealm(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = utils.determineProtocol(params.ssl) + v.authAdminURL
                    + '/' + params.account
                    + '/realms/' + params.realm
                    + '/confirm' + (txParam ? '&' + txParam : '');
                v.$.post(url, {confirmationId: params.confirmationId}).then(function (json) {
                    // Store the returned username, and also the param account and realm if available
                    if (json.username) {
                        utils.setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(json.username));
                    }
                    if (params.account) {
                        utils.setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(params.account));
                    }
                    if (params.realm) {
                        utils.setSessionStorageItem(btoa(keys.REALM_KEY), btoa(params.realm));
                    }

                    resolve(json);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        /**
         * Resend the confirmation email for a realm user account registration
         * This will mark the realm user unconfirmed/invalid as part of the process
         *
         * @param {Object} params
         * @param {String} params.metadata containing the email template
         * @param {String} params.account to send the email to
         * @param {String} params.username to send the email to
         * @returns Promise containing the response
         */
        resendConfirmRealmUserEmail: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                // Check metadata, account, and username
                validateRequiredMetadata(params, reject);
                validateRequiredAccount(params, reject);
                utils.validateRequiredRealm(params, reject);
                utils.validateRequiredUsername(params, reject);

                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var txParam = utils.getTransactionURLParam();
                var url = utils.determineProtocol(params.ssl) + v.authAdminURL + '/' + params.account
                    + '/realms/' + params.realm
                    + '/users/' + params.username + '/invalidate?access_token=' + token
                    + (txParam ? '&' + txParam : '');
                v.$.post(url, {metadata: params.metadata}).then(function (json) {
                    resolve(json);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        getRealmUser: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var username = utils.validateAndReturnRequiredUsername(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'users/' + username, token, params.ssl);

                v.$.getJSON(url).then(function (json) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.user);
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },

        updateRealmUser: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                validateRequiredUser(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'users/' + params.user.username, token, params.ssl);

                v.$.put(url, {user: params.user}).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        deleteRealmUser: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateAndReturnRequiredUsername(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'users/' + params.username, token, params.ssl);

                v.$.doDelete(url).then(function () {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        /* Realm Roles */

        getRealmRoles: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'roles', token, params.ssl);

                v.$.getJSON(url).then(function (json) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.roles);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        createRealmRole: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                validateRequiredRole(params, reject);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'roles', token, params.ssl);

                v.$.post(url, {role: params.role}).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(response.resourceLocation);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        updateRealmRole: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                validateRequiredRole(params, reject);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'roles/' + params.role.name, token, params.ssl);

                v.$.put(url, {role: params.role}).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        deleteRealmRole: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                validateRequiredId(params, reject);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'roles/' + params.id, token, params.ssl);

                v.$.doDelete(url).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        /* Realm Contexts */

        getAllRealmContexts: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'contexts', token, params.ssl);

                v.$.getJSON(url).then(function (json) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.contexts);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        getRealmContext: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'contexts/' + params.username, token, params.ssl);

                v.$.getJSON(url).then(function (json) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(json.context);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        updateRealmContext: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                validateRequiredRole(params, reject);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'contexts/' + params.context.username, token, params.ssl);

                v.$.put(url, {context: params.context}).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        getLogs: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var query = params.query ? encodeURIComponent(JSON.stringify(params.query)) : '{}';
                var fields = params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : '{}';
                var options = params.options ? encodeURIComponent(JSON.stringify(params.options)) : '{}';

                var url = utils.determineProtocol(params.ssl) + v.authAdminURL + '/' + account + '/logging/?access_token=' +
                    token + '&query=' + query + '&fields=' + fields + '&options=' + options;

                v.$.getJSON(url).then(function (logs) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(logs);
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },

        getDebugLogs: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var query = params.query ? encodeURIComponent(JSON.stringify(params.query)) : '{}';
                var fields = params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : '{}';
                var options = params.options ? encodeURIComponent(JSON.stringify(params.options)) : '{}';

                var url = utils.determineProtocol(params.ssl) + v.authAdminURL + '/' + account + '/realms/' + realm +
                    '/debugLogging/?access_token=' + token + '&query=' + query + '&fields=' + fields + '&options=' + options;

                v.$.getJSON(url).then(function (logs) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(logs);
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },

        createAdministrator: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var admin = utils.validateAndReturnRequiredAdmin(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = utils.determineProtocol(params.ssl) + v.authAdminURL + '/' + account + '/admins/?access_token=' + token +
                    (txParam ? '&' + txParam : '');

                v.$.post(url, {admin: admin}).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        updateAdministrator: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var admin = utils.validateAndReturnRequiredAdmin(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = utils.determineProtocol(params.ssl) + v.authAdminURL + '/' + account + '/admins/' + admin.username +
                    '/?access_token=' + token + (txParam ? '&' + txParam : '');

                v.$.put(url, {admin: admin}).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },

        deleteAdministrator: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};
                v.checkHost(params);

                utils.validateRequiredUsername(params, reject);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var username = utils.validateAndReturnRequiredUsername(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = utils.determineProtocol(params.ssl) + v.authAdminURL + '/' + account + '/admins/' + username + '/?access_token=' + token +
                    (txParam ? '&' + txParam : '');

                v.$.doDelete(url).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        }
    };
}
