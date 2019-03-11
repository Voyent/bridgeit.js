function AdminService(v, keys, utils) {
    function validateRequiredUser(params, reject) {
        utils.validateParameter('user', 'The user parameter is required', params, reject);
    }

    function validateRequiredRole(params, reject) {
        utils.validateParameter('role', 'The role parameter is required', params, reject);
    }
    
    function validateRequiredGroup(params, reject) {
        utils.validateParameter('group', 'The group parameter is required', params, reject);
    }
    
    function validateRequiredTopic(params, reject) {
        utils.validateParameter('topic', 'The topic parameter is required', params, reject);
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
         * @returns Promise with a json object of the service definitions
         *
         */
        getServiceDefinitions: function (params) {
            return new Promise(
                function (resolve, reject) {
                    params = params ? params : {};

                    //validate
                    var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                    var txParam = utils.getTransactionURLParam();
                    var url = v.authAdminURL + '/system/services/?access_token=' + token +
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

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/' + account + '?access_token=' + token +
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
         * Get all accounts on the current host.
         *
         * @memberOf voyent.admin
         * @alias createAccount
         * @param {Object} params params
		 * @param {String} params.token The access token.
         * @returns Promise with array of account objects.
         *
         */
        getAccounts: function(params){
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                //validate
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var url = v.sysAdminURL + '/accounts?access_token=' + token;

                v.$.getJSON(url).then(function (json) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(json);
                })['catch'](function (error) {
                    reject(error);
                });

            });
        },

        /**
         * Get the billing report for a given account and realm. 
         *
         * @memberOf voyent.admin
         * @alias createAccount
         * @param {Object} params params
         * @param {String} params.account The name of the account to get metrics from (required)
         * @param {String} params.realm The name of the realm to get metrics from (required)
		 * @param {String} params.token The access token.
         * @param {String} params.year The year of the metrics to get. If not found, will result to current year (optional)
         * @param {String} params.month The month of the metrics to get. If not found, will result to current year (optional)
         * @returns Promise with billing report as array.
         *
         */
        getBillingReport:function(params){
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                //validate
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realmName = utils.validateAndReturnRequiredRealmName(params, reject);
                var url;
                if(params.month && params.year){
                    url = v.sysAdminURL + '/' + account + '/realms/' + realmName + '/billingSummary'
                        + '?access_token=' + token + '&' + utils.getTransactionURLParam()+ '&year=' + params.year + "&month=" + params.month;
                }
                else {
                   //no month/year, just get most recent.
                    url = v.sysAdminURL + '/' + account + '/realms/' + realmName + '/billingSummary'
                        + '?access_token=' + token + '&' + utils.getTransactionURLParam();
                }

                v.$.getJSON(url).then(function (json) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(json);
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
         * @param {String} params.account The name of the new account (required)
         * @param {String} params.username The username for the new administrator (required)
         * @param {String} params.email The email of the new administrator (required)
         * @param {String} params.firstname The first name of the new administrator (required)
         * @param {String} params.lastname The last name of the new administrator (required)
         * @param {String} params.password The password of the new administrator (required)
         * @param {String} params.roles An array of roles to grant the account owner. If not provided the user will have the `accountOwner` role.
         * @returns Promise with an access token for the new administrator
         *
         */
        createAccount: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

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
                admin.roles = params.roles || ['accountOwner'];

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
                var url = v.authAdminURL + '/' + (txParam ? '&' + txParam : '');
                var loggedInAt = new Date().getTime();
                v.$.post(url, {account: account}).then(function (json) {
                    v.auth.updateLastActiveTimestamp();

                    utils.setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(utils.sanitizeAccountName(accountname)));
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
         * Update an entire account
         *
         * @memberOf voyent.admin
         * @alias editAccount
         * @param {Object} params params
         * @param {String} params.accountname The account name to update
         * @returns Promise
         */
        updateTopLevelAccount: function(params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                
                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/'
                           + account + '?access_token=' + token + (txParam ? '&' + txParam : '');
                
                v.$.put(url, {'account': params}).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },
        
        /**
         * Update an account admin
         *
         * @memberOf voyent.admin
         * @alias updateAccount
         * @param {Object} params params
         * @param {String} params.username The admin username to update (required)
         * @param {String} params.email Updated email
         * @param {String} params.firstname Updated first name
         * @param {String} params.lastname Updated last name
         * @param {String} params.custom Any custom data (optional)
         * @param {String} params.password Password to update, if not present will remain unchanged
         * @returns Promise
         */
        updateAccount: function(params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                // Ensure we have an admin username
                if (!params.username || typeof params.username === 'undefined') {
                    reject(Error('Admin username to update is required'));
                }
                
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                
                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/'
                           + account + '/admins/' + params.username + '?access_token=' + token + (txParam ? '&' + txParam : '');
                
                v.$.put(url, {'admin': params}).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
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

                // Check confirmationId and account
                validateRequiredConfirmationId(params, reject);
                validateRequiredAccount(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/' + params.account + '/confirm' + (txParam ? '&' + txParam : '');
                v.$.post(url, {confirmationId: params.confirmationId}).then(function (json) {
                    // Store the returned username, and also the param account and realm if available
                    if (json.username) {
                        utils.setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(json.username));
                    }
                    if (params.account) {
                        utils.setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(utils.sanitizeAccountName(params.account)));
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

                // Check metadata, account, and username
                validateRequiredMetadata(params, reject);
                validateRequiredAccount(params, reject);
                utils.validateRequiredUsername(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/'
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

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var url = v.authAdminURL + '/' + account + '/realms/'
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

                // Set 'nostore' to ensure the following checks don't update our lastKnown calls
                params.nostore = true;

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    '', token);

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

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateRequiredRealm(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, params.realm.name,
                    '', token);

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
                
                // Set 'nostore' to ensure the following checks don't update our lastKnown calls
                params.nostore = true;

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateAndReturnRequiredRealmName(params, reject);
                utils.validateRequiredRealm(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/' + account + '/realms?access_token=' + token +
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

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var originRealmName = validateAndReturnRequiredOriginRealmName(params, reject);
                var destRealmName = validateAndReturnRequiredDestRealmName(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/' + account + '/realms/' + originRealmName + '/clone/' +
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

                // Set 'nostore' to ensure the following checks don't update our lastKnown calls
                params.nostore = true;

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var realmName = utils.validateAndReturnRequiredRealmName(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realmName,
                    '', token);

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

                // Set 'nostore' to ensure the following checks don't update our lastKnown calls
                params.nostore = true;

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'users/', token, {
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

        createRealmUser: function (params, fromUser) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                // Set 'nostore' to ensure the following checks don't update our lastKnown calls
                params.nostore = true;
                
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                
                validateRequiredUser(params, reject);
                
                // By default hit the "users" endpoint, which is used for admins
                // However if the call is from a user trying to create another user, then use the "realmUser" endpoint
                var endpoint = 'users';
                if (fromUser) {
                    endpoint = 'realmUser';
                }
                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    endpoint, token);

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

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'register', false);

                var password = v.auth.generatePassword();
                var toPost = {user: {password: password}};

                if (params.metadata) {
                    toPost.metadata = params.metadata;
                }
                if (params.custom) {
                    toPost.user.custom = params.custom;
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
         * Attempt to create/register a new realm user
         * If no password is provided (under params.users.password) one will be generated
         *
         * @param {Object} params
         * @param {String} params.account to validate with
         * @param {String} params.realm to validate with
         * @param {Object} params.user containing details to create
         */
        createUser: function (params) {
            return new Promise(function (resolve, reject) {
                params = params ? params : {};

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                
                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm, 'register');
                
                // Check for user data
                if (!params.user) {
                    reject(Error('No user data to submit was found'));
                    return;
                }
                
                // If no password is found, generate one
                if (!params.user.password) {
                    params.user.password = v.auth.generatePassword();
                }
                
                v.$.post(url, params).then(function (response) {
                    resolve(response);
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

                // Check confirmationId, account, and realm
                validateRequiredConfirmationId(params, reject);
                validateRequiredAccount(params, reject);
                utils.validateRequiredRealm(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL
                    + '/' + params.account
                    + '/realms/' + params.realm
                    + '/confirm' + (txParam ? '&' + txParam : '');
                v.$.post(url, {confirmationId: params.confirmationId}).then(function (json) {
                    // Store the returned username, and also the param account and realm if available
                    if (json.username) {
                        utils.setSessionStorageItem(btoa(keys.USERNAME_KEY), btoa(json.username));
                    }
                    if (params.account) {
                        utils.setSessionStorageItem(btoa(keys.ACCOUNT_KEY), btoa(utils.sanitizeAccountName(params.account)));
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

                // Check metadata, account, and username
                validateRequiredMetadata(params, reject);
                validateRequiredAccount(params, reject);
                utils.validateRequiredRealm(params, reject);
                utils.validateRequiredUsername(params, reject);

                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/' + params.account
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

                // Set 'nostore' to ensure the following checks don't update our lastKnown calls
                params.nostore = true;

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var username = utils.validateAndReturnRequiredUsername(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'users/' + username, token);

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

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                validateRequiredUser(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'users/' + params.user.username, token);

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

                // Set 'nostore' to ensure the following checks don't update our lastKnown calls
                params.nostore = true;

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                utils.validateAndReturnRequiredUsername(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'users/' + params.username, token);

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

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'roles', token);

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

                validateRequiredRole(params, reject);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'roles', token);

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

                validateRequiredRole(params, reject);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'roles/' + params.role.name, token);

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

                validateRequiredId(params, reject);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'roles/' + params.id, token);

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

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'contexts', token);

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

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'contexts/' + params.username, token);

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

                validateRequiredRole(params, reject);

                //validate
                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'contexts/' + params.context.username, token);

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

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var query = params.query ? encodeURIComponent(JSON.stringify(params.query)) : '{}';
                var fields = params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : '{}';
                var options = params.options ? encodeURIComponent(JSON.stringify(params.options)) : '{}';

                var url = v.authAdminURL + '/' + account + '/logging/?access_token=' +
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

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealm(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var query = params.query ? encodeURIComponent(JSON.stringify(params.query)) : '{}';
                var fields = params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : '{}';
                var options = params.options ? encodeURIComponent(JSON.stringify(params.options)) : '{}';

                var url = v.authAdminURL + '/' + account + '/realms/' + realm +
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

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var admin = utils.validateAndReturnRequiredAdmin(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/' + account + '/admins/?access_token=' + token +
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

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var admin = utils.validateAndReturnRequiredAdmin(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/' + account + '/admins/' + admin.username +
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

                utils.validateRequiredUsername(params, reject);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);
                var username = utils.validateAndReturnRequiredUsername(params, reject);

                var txParam = utils.getTransactionURLParam();
                var url = v.authAdminURL + '/' + account + '/admins/' + username + '/?access_token=' + token +
                    (txParam ? '&' + txParam : '');

                v.$.doDelete(url).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve();
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },
        
        getAllUserGroups: function(params) {
            return new Promise(function(resolve, reject) {
                params = params ? params : {};

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'groups/', token);
                    
                v.$.get(url).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(response);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },
        
        getUserGroupDetails: function(params) {
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                
                validateRequiredGroup(params, reject);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'groups/' + params.group + '/details', token);
                    
                v.$.get(url).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(response);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },
        
        createUserGroup: function(params) {
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                
                validateRequiredGroup(params, reject);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'groups/', token);
                    
                v.$.post(url, { group: params.group }).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(response);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },
        
        updateUserGroup: function(params) {
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                
                validateRequiredGroup(params, reject);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'groups/' + params.group.groupId, token);
                    
                v.$.put(url, { group: params.group }).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(response);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },
        
        deleteUserGroup: function(params) {
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                
                validateRequiredGroup(params, reject);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'groups/' + params.group, token);
                    
                v.$.doDelete(url).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(response);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },
        
        getAllPublicTopics: function(params) {
            return new Promise(function(resolve, reject) {
                params = params ? params : {};

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'topics/', token);
                
                v.$.get(url).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(response);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },
        
        getPublicTopicDetails: function(params) {
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                
                validateRequiredTopic(params, reject);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'topics/' + params.topic + '/details', token);
                    
                v.$.get(url).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(response);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },
        
        createPublicTopic: function(params) {
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                
                validateRequiredTopic(params, reject);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'topics/', token);
                    
                v.$.post(url, { topic: params.topic }).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(response);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },
        
        updatePublicTopic: function(params) {
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                
                validateRequiredTopic(params, reject);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'topics/' + params.topic.groupId, token);
                    
                v.$.put(url, { topic: params.topic }).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(response);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },
        
        deletePublicTopic: function(params) {
            return new Promise(function(resolve, reject) {
                params = params ? params : {};
                
                validateRequiredTopic(params, reject);

                var account = utils.validateAndReturnRequiredAccount(params, reject);
                var realm = utils.validateAndReturnRequiredRealmName(params, reject);
                var token = utils.validateAndReturnRequiredAccessToken(params, reject);

                var url = utils.getRealmResourceURL(v.authAdminURL, account, realm,
                    'topics/' + params.topic, token);
                    
                v.$.doDelete(url).then(function (response) {
                    v.auth.updateLastActiveTimestamp();
                    resolve(response);
                })['catch'](function (error) {
                    reject(error);
                });
            });
        },
    };
}
