import * as keys from './keys'
import * as utils from './private-utils'
import { authAdminURL, sysAdminURL, post, put, doDelete, get, getJSON } from './public-utils'
import { updateLastActiveTimestamp, getLastKnownRealm, generatePassword } from './auth-service'

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
    const email = params.email;
    if (email) {
        return email;
    }
    else {
        return reject(Error('The Voyent email parameter is required'));
    }
}

function validateAndReturnRequiredFirstname(params, reject) {
    const firstname = params.firstname;
    if (firstname) {
        return firstname;
    }
    else {
        return reject(Error('The Voyent firstname parameter is required'));
    }
}

function validateAndReturnRequiredLastname(params, reject) {
    const lastname = params.lastname;
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
    const admin = params.admin;
    if (admin) {
        return admin;
    }
    else {
        return reject(Error('The admin parameter is required'));
    }
}

function validateAndReturnRequiredOriginRealmName(params, reject) {
    let realm = params.originRealmName;
    if (realm) {
        realm = encodeURI(realm);
    }
    else {
        realm = getLastKnownRealm();
    }
    if (realm) {
        return realm;
    }
    else {
        return reject(Error('The Voyent originRealmName is required'));
    }
}

function validateAndReturnRequiredDestRealmName(params, reject) {
    let realm = params.destRealmName;
    if (realm) {
        realm = encodeURI(realm);
        return realm;
    }
    else {
        return reject(Error('The Voyent destRealmName is required'));
    }
}

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
export function getServiceDefinitions(params) {
    return new Promise(
        function (resolve, reject) {
            params = params ? params : {};

            //validate
            const token = utils.validateAndReturnRequiredAccessToken(params, reject);
            const txParam = utils.getTransactionURLParam();
            const url = authAdminURL + '/system/services/?access_token=' + token +
                (txParam ? '&' + txParam : '');

            getJSON(url).then(function (json) {
                updateLastActiveTimestamp();
                resolve(json);
            })['catch'](function (error) {
                reject(error);
            });

        }
    );
}

export function getAccount(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        //validate
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const txParam = utils.getTransactionURLParam();
        const url = authAdminURL + '/' + account + '?access_token=' + token +
            (txParam ? '&' + txParam : '');

        getJSON(url).then(function (json) {
            updateLastActiveTimestamp();
            resolve(json.account);
        })['catch'](function (error) {
            reject(error);
        });

    });
}

export function getAccountSysadmin(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};
        //validate
		params.nostore = true;
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const txParam = utils.getTransactionURLParam();
        const url = sysAdminURL + '/accounts/' + account + '?access_token=' + token +
                (txParam ? '&' + txParam : '');

            getJSON(url).then(function (json) {
                updateLastActiveTimestamp();
                resolve(json.account);
            })['catch'](function (error) {
                reject(error);
            });

        });
}

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
export function getAccounts(params){
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        //validate
		params.nostore = true;
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        const url = sysAdminURL + '/accounts?access_token=' + token;

        getJSON(url).then(function (json) {
            updateLastActiveTimestamp();
            resolve(json);
        })['catch'](function (error) {
            reject(error);
        });

    });
}

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
export function getBillingReport(params){
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        //validate
		params.nostore = true;
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realmName = utils.validateAndReturnRequiredRealmName(params, reject);
        let url;
        if(params.month !== null && params.year){
            if(params.date){
                url = sysAdminURL + '/' + account + '/realms/' + realmName + '/dailyBillingSummary'
                    + '?access_token=' + token + '&' + utils.getTransactionURLParam()+ '&year=' + params.year + "&month=" + params.month + "&date=" + params.date;
            }
            else{
                url = sysAdminURL + '/' + account + '/realms/' + realmName + '/billingSummary'
                    + '?access_token=' + token + '&' + utils.getTransactionURLParam()+ '&year=' + params.year + "&month=" + params.month;
            }
        }
        else {
           //no month/year, just get most recent.
            url = sysAdminURL + '/' + account + '/realms/' + realmName + '/billingSummary'
                + '?access_token=' + token + '&' + utils.getTransactionURLParam();
        }

        getJSON(url).then(function (json) {
            updateLastActiveTimestamp();
            resolve(json);
        })['catch'](function (error) {
            reject(error);
        });

    });
}

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
 * @returns Promise with an access token for the new administrator
 *
 */
export function createAccount(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        const account = {admins: []};
        const accountname = utils.validateAndReturnRequiredAccount(params, reject);
        account.accountname = accountname;

        if (params.description) {
            account.description = params.description;
        }

        const admin = {};
        const username = utils.validateAndReturnRequiredUsername(params, reject);
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

        const txParam = utils.getTransactionURLParam();
        const url = authAdminURL + '/' + (txParam ? '&' + txParam : '');
        const loggedInAt = new Date().getTime();
        post(url, {account: account}).then(function (json) {
            updateLastActiveTimestamp();

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
}

/**
 * Update an entire account
 *
 * @memberOf voyent.admin
 * @alias editAccount
 * @param {Object} params params
 * @param {String} params.accountname The account name to update
 * @returns Promise
 */
export function updateTopLevelAccount(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const txParam = utils.getTransactionURLParam();
        const url = authAdminURL + '/'
            + account + '?access_token=' + token + (txParam ? '&' + txParam : '');

        put(url, {'account': params}).then(function (response) {
            updateLastActiveTimestamp();
            resolve();
        })['catch'](function (error) {
            reject(error);
        });
    });
}

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
export function updateAccount(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        // Ensure we have an admin username
        if (!params.username || typeof params.username === 'undefined') {
            reject(Error('Admin username to update is required'));
        }

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const txParam = utils.getTransactionURLParam();
        const url = authAdminURL + '/'
            + account + '/admins/' + params.username + '?access_token=' + token + (txParam ? '&' + txParam : '');

        put(url, {'admin': params}).then(function (response) {
            updateLastActiveTimestamp();
            resolve();
        })['catch'](function (error) {
            reject(error);
        });
    });
}

/**
 * Attempt to confirm an account
 * This would happen when a new account (from createAccount) had an email confirmation sent to them
 *
 * @param {Object} params
 * @param {String} params.confirmationId from the email and returned url, used to check
 * @param {String} params.account to validate with
 * @returns Promise containing the response, which if successful will have username available
 */
export function confirmAccount(params){
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        // Check confirmationId and account
        validateRequiredConfirmationId(params, reject);
        validateRequiredAccount(params, reject);

        const txParam = utils.getTransactionURLParam();
        const url = authAdminURL + '/' + params.account + '/confirm' + (txParam ? '&' + txParam : '');
        post(url, {confirmationId: params.confirmationId}).then(function (json) {
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
}

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
export function resendConfirmAccountEmail(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        // Check metadata, account, and username
        validateRequiredMetadata(params, reject);
        validateRequiredAccount(params, reject);
        utils.validateRequiredUsername(params, reject);

        const txParam = utils.getTransactionURLParam();
        const url = authAdminURL + '/'
            + params.account + '/admins/'
            + params.username + '/resendLink'
            + (txParam ? '&' + txParam : '');
        post(url, {metadata: params.metadata}).then(function (json) {
            resolve(json);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

/* Realm admin */

export function getRealms(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        //validate
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        const url = authAdminURL + '/' + account + '/realms/'
            + '?access_token=' + token + '&' + utils.getTransactionURLParam();

        getJSON(url).then(function (json) {
            updateLastActiveTimestamp();
            resolve(json.realms);
        })['catch'](function (error) {
            reject(error);
        });

    });
}

export function getRealm(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        // Set 'nostore' to ensure the following checks don't update our lastKnown calls
        params.nostore = true;

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            '', token);

        getJSON(url).then(function (json) {
            updateLastActiveTimestamp();
            resolve(json.realm);
        })['catch'](function (error) {
            reject(error);
        });

    });
}

export function updateRealm(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        utils.validateRequiredRealm(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, params.realm.name,
            '', token);

        put(url, {realm: params.realm}).then(function () {
            updateLastActiveTimestamp();
            resolve();
        })['catch'](function (error) {
            reject(error);
        });

    });
}

export function createRealm(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        // Set 'nostore' to ensure the following checks don't update our lastKnown calls
        params.nostore = true;

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        utils.validateAndReturnRequiredRealmName(params, reject);
        utils.validateRequiredRealm(params, reject);

        const txParam = utils.getTransactionURLParam();
        const url = authAdminURL + '/' + account + '/realms?access_token=' + token +
            (txParam ? '&' + txParam : '');

        post(url, {realm: params.realm}).then(function (json) {
            updateLastActiveTimestamp();
            resolve(json.resourceLocation);
        })['catch'](function (error) {
            reject(error);
        });

    });
}

export function cloneRealm(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        const originRealmName = validateAndReturnRequiredOriginRealmName(params, reject);
        const destRealmName = validateAndReturnRequiredDestRealmName(params, reject);

        const txParam = utils.getTransactionURLParam();
        const url = authAdminURL + '/' + account + '/realms/' + originRealmName + '/clone/' +
            destRealmName + '?access_token=' + token + (txParam ? '&' + txParam : '');

        post(url, {realm: params.realm}).then(function (json) {
            updateLastActiveTimestamp();
            resolve(json.resourceLocation);
        })['catch'](function (error) {
            reject(error);
        });

    });
}

export function deleteRealm(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        // Set 'nostore' to ensure the following checks don't update our lastKnown calls
        params.nostore = true;

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        const realmName = utils.validateAndReturnRequiredRealmName(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realmName,
            '', token);

        doDelete(url).then(function () {
            updateLastActiveTimestamp();
            resolve();
        })['catch'](function (error) {
            reject(error);
        });

    });
}

/* Realm Users */

export function getRealmUsers(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        // Set 'nostore' to ensure the following checks don't update our lastKnown calls
        params.nostore = true;

        //validate
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'users/', token, {
                'query': params.query ? encodeURIComponent(JSON.stringify(params.query)) : {},
                'fields': params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : {},
                'options': params.options ? encodeURIComponent(JSON.stringify(params.options)) : {}
            }
        );

        getJSON(url).then(function (json) {
            updateLastActiveTimestamp();
            resolve(json.users);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function createRealmUser(params, fromUser) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        // Set 'nostore' to ensure the following checks don't update our lastKnown calls
        params.nostore = true;

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        validateRequiredUser(params, reject);

        // By default hit the "users" endpoint, which is used for admins
        // However if the call is from a user trying to create another user, then use the "realmUser" endpoint
        let endpoint = 'users';
        if (fromUser) {
            endpoint = 'realmUser';
        }
        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            endpoint, token);

        const toPost = {user: params.user};

        if (params.metadata) {
            toPost.metadata = params.metadata;
        }

        post(url, toPost).then(function (response) {
            updateLastActiveTimestamp();
            resolve(response.resourceLocation);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

/**
 * Attempt to create an anonymous realm user
 *
 * @param {Object} params
 * @param {String} params.account to validate with
 * @param {String} params.realmName to validate with
 * @returns Object with the username and password
 */
export function createAnonUser(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const user = utils.validateAndReturnRequiredUser(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'register', false);

        user.password = generatePassword();
        const toPost = { user: user };

        if (params.metadata) {
            toPost.metadata = params.metadata;
        }

        post(url, toPost).then(function (response) {
            updateLastActiveTimestamp();
            const anonUser = {
                password: user.password,
                username: response.resourceLocation.substring(response.resourceLocation.lastIndexOf('/') + 1),
                deregistrationToken: response.deregistrationToken
            };
            resolve(anonUser);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

/**
 * Attempt to create/register a new realm user
 * If no password is provided (under params.users.password) one will be generated
 *
 * @param {Object} params
 * @param {String} params.account to validate with
 * @param {String} params.realm to validate with
 * @param {Object} params.user containing details to create
 */
export function createUser(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealm(params, reject);
        const user = utils.validateAndReturnRequiredUser(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm, 'register');

        // If no password is found, generate one
        if (!user.password) {
            user.password = generatePassword();
        }

        post(url, { user: user }).then(function (response) {
            resolve(response);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

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
export function confirmRealmUser(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        // Check confirmationId, account, and realm
        validateRequiredConfirmationId(params, reject);
        validateRequiredAccount(params, reject);
        utils.validateRequiredRealm(params, reject);

        const txParam = utils.getTransactionURLParam();
        const url = authAdminURL
            + '/' + params.account
            + '/realms/' + params.realm
            + '/confirm' + (txParam ? '&' + txParam : '');
        post(url, {confirmationId: params.confirmationId}).then(function (json) {
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
}

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
export function resendConfirmRealmUserEmail(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        // Check metadata, account, and username
        validateRequiredMetadata(params, reject);
        validateRequiredAccount(params, reject);
        utils.validateRequiredRealm(params, reject);
        utils.validateRequiredUsername(params, reject);

        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        const txParam = utils.getTransactionURLParam();
        const url = authAdminURL + '/' + params.account
            + '/realms/' + params.realm
            + '/users/' + params.username + '/invalidate?access_token=' + token
            + (txParam ? '&' + txParam : '');
        post(url, {metadata: params.metadata}).then(function (json) {
            resolve(json);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function getRealmUser(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        // Set 'nostore' to ensure the following checks don't update our lastKnown calls
        params.nostore = true;

        //validate
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        const username = utils.validateAndReturnRequiredUsername(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'users/' + username, token);

        getJSON(url).then(function (json) {
            updateLastActiveTimestamp();
            resolve(json.user);
        })['catch'](function (error) {
            reject(error);
        });

    });
}

export function updateRealmUser(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        validateRequiredUser(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'users/' + params.user.username, token);

        put(url, {user: params.user}).then(function (response) {
            updateLastActiveTimestamp();
            resolve();
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function deleteRealmUser(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        // Set 'nostore' to ensure the following checks don't update our lastKnown calls
        params.nostore = true;

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        utils.validateAndReturnRequiredUsername(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'users/' + params.username, token);

        doDelete(url).then(function () {
            updateLastActiveTimestamp();
            resolve();
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function getRecipients(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        // Set 'nostore' to ensure the following checks don't update our lastKnown calls.
        params.nostore = true;

        // Get and validate the required parameters.
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        const opts = params.opts && typeof params.opts === 'object'
            ? encodeURIComponent(JSON.stringify(params.opts))
            : '{}';

        // Build the URL.
        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'recipients', token, {
                opts: opts
            }
        );

        // Make the request.
        getJSON(url).then(function (json) {
            updateLastActiveTimestamp();
            resolve(json);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function createRecipient(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        // Set 'nostore' to ensure the following checks don't update our lastKnown calls.
        params.nostore = true;

        // Get and validate the required parameters.
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        const user = utils.validateAndReturnRequiredUser(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'recipients', token
        );

        // If no password is found, generate one
        if (!user.password) {
            user.password = generatePassword();
        }

        post(url, { user: user }).then(function (response) {
            updateLastActiveTimestamp();
            resolve(response);
        }).catch(function (error) {
            reject(error);
        });
    });
}

export function getAdminsList(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        // Set 'nostore' to ensure the following checks don't update our lastKnown calls.
        params.nostore = true;

        // Get and validate the required parameters.
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        const opts = params.opts && typeof params.opts === 'object'
            ? encodeURIComponent(JSON.stringify(params.opts))
            : '{}';

        // Build the URL.
        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'admins', token, {
                opts: opts
            }
        );

        // Make the request.
        getJSON(url).then(function (json) {
            updateLastActiveTimestamp();
            resolve(json);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function getGroupsList(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        // Set 'nostore' to ensure the following checks don't update our lastKnown calls.
        params.nostore = true;

        // Get and validate the required parameters.
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        const opts = params.opts && typeof params.opts === 'object'
            ? encodeURIComponent(JSON.stringify(params.opts))
            : '{}';

        // Build the URL.
        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'groupsList', token, {
                opts: opts
            }
        );

        // Make the request.
        getJSON(url).then(function (json) {
            updateLastActiveTimestamp();
            resolve(json);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function getTopicsList(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        // Set 'nostore' to ensure the following checks don't update our lastKnown calls.
        params.nostore = true;

        // Get and validate the required parameters.
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        const opts = params.opts && typeof params.opts === 'object'
            ? encodeURIComponent(JSON.stringify(params.opts))
            : '{}';

        // Build the URL.
        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'topicsList', token, {
                opts: opts
            }
        );

        // Make the request.
        getJSON(url).then(function (json) {
            updateLastActiveTimestamp();
            resolve(json);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function linkUser(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        // Set 'nostore' to ensure the following checks don't update our lastKnown calls
        params.nostore = true;

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        utils.validateAndReturnRequiredUsername(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'users/' + params.username + '/link', token);

        post(url).then(function(res) {
            updateLastActiveTimestamp();
            resolve(res);
        })['catch'](function(error) {
            reject(error);
        });
    });
}


export function unlinkUser(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        // Set 'nostore' to ensure the following checks don't update our lastKnown calls
        params.nostore = true;

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        utils.validateAndReturnRequiredUsername(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'users/' + params.username + '/link', token);

        doDelete(url).then(function() {
            updateLastActiveTimestamp();
            resolve();
        })['catch'](function(error) {
            reject(error);
        });
    });
}

/* Realm Roles */

export function getRealmRoles(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        //validate
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'roles', token);

        getJSON(url).then(function (json) {
            updateLastActiveTimestamp();
            resolve(json.roles);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function createRealmRole(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        validateRequiredRole(params, reject);

        //validate
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'roles', token);

        post(url, {role: params.role}).then(function (response) {
            updateLastActiveTimestamp();
            resolve(response.resourceLocation);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function updateRealmRole(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        validateRequiredRole(params, reject);

        //validate
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'roles/' + params.role.name, token);

        put(url, {role: params.role}).then(function (response) {
            updateLastActiveTimestamp();
            resolve();
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function deleteRealmRole(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        utils.validateRequiredId(params, reject);

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'roles/' + params.id, token);

        doDelete(url).then(function (response) {
            updateLastActiveTimestamp();
            resolve();
        })['catch'](function (error) {
            reject(error);
        });
    });
}

/* Realm Contexts */

export function getAllRealmContexts(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        //validate
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'contexts', token);

        getJSON(url).then(function (json) {
            updateLastActiveTimestamp();
            resolve(json.contexts);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function getRealmContext(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        //validate
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'contexts/' + params.username, token);

        getJSON(url).then(function (json) {
            updateLastActiveTimestamp();
            resolve(json.context);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function updateRealmContext(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        validateRequiredRole(params, reject);

        //validate
        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'contexts/' + params.context.username, token);

        put(url, {context: params.context}).then(function (response) {
            updateLastActiveTimestamp();
            resolve();
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function getLogs(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const query = params.query ? encodeURIComponent(JSON.stringify(params.query)) : '{}';
        const fields = params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : '{}';
        const options = params.options ? encodeURIComponent(JSON.stringify(params.options)) : '{}';

        const url = authAdminURL + '/' + account + '/logging/?access_token=' +
            token + '&query=' + query + '&fields=' + fields + '&options=' + options;

        getJSON(url).then(function (logs) {
            updateLastActiveTimestamp();
            resolve(logs);
        })['catch'](function (error) {
            reject(error);
        });

    });
}

export function getDebugLogs(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealm(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const query = params.query ? encodeURIComponent(JSON.stringify(params.query)) : '{}';
        const fields = params.fields ? encodeURIComponent(JSON.stringify(params.fields)) : '{}';
        const options = params.options ? encodeURIComponent(JSON.stringify(params.options)) : '{}';

        const url = authAdminURL + '/' + account + '/realms/' + realm +
            '/debugLogging/?access_token=' + token + '&query=' + query + '&fields=' + fields + '&options=' + options;

        getJSON(url).then(function (logs) {
            updateLastActiveTimestamp();
            resolve(logs);
        })['catch'](function (error) {
            reject(error);
        });

    });
}

export function createAdministrator(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        const admin = validateAndReturnRequiredAdmin(params, reject);

        const txParam = utils.getTransactionURLParam();
        const url = authAdminURL + '/' + account + '/admins/?access_token=' + token +
            (txParam ? '&' + txParam : '');

        post(url, {admin: admin}).then(function (response) {
            updateLastActiveTimestamp();
            resolve();
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function updateAdministrator(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        const admin = validateAndReturnRequiredAdmin(params, reject);

        const txParam = utils.getTransactionURLParam();
        const url = authAdminURL + '/' + account + '/admins/' + admin.username +
            '/?access_token=' + token + (txParam ? '&' + txParam : '');

        put(url, {admin: admin}).then(function (response) {
            updateLastActiveTimestamp();
            resolve();
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function deleteAdministrator(params) {
    return new Promise(function (resolve, reject) {
        params = params ? params : {};

        utils.validateRequiredUsername(params, reject);

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);
        const username = utils.validateAndReturnRequiredUsername(params, reject);

        const txParam = utils.getTransactionURLParam();
        const url = authAdminURL + '/' + account + '/admins/' + username + '/?access_token=' + token +
            (txParam ? '&' + txParam : '');

        doDelete(url).then(function (response) {
            updateLastActiveTimestamp();
            resolve();
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function getAllUserGroups(params) {
    return new Promise(function(resolve, reject) {
        params = params ? params : {};

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        let url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'groups/', token);
        
        // Add terse if requested, which will avoid getting a potentially large list of usernames
        if (params.terse) {
            url += '&terse=true';
        }

        get(url).then(function (response) {
            updateLastActiveTimestamp();
            resolve(response);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function getUserGroupDetails(params) {
    return new Promise(function(resolve, reject) {
        params = params ? params : {};

        validateRequiredGroup(params, reject);

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'groups/' + params.group + '/details', token);

        get(url).then(function (response) {
            updateLastActiveTimestamp();
            resolve(response);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function createUserGroup(params) {
    return new Promise(function(resolve, reject) {
        params = params ? params : {};

        validateRequiredGroup(params, reject);

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'groups/', token);

        post(url, { group: params.group }).then(function (response) {
            updateLastActiveTimestamp();
            resolve(response);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function updateUserGroup(params) {
    return new Promise(function(resolve, reject) {
        params = params ? params : {};

        validateRequiredGroup(params, reject);

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'groups/' + params.group.groupId, token);

        put(url, { group: params.group }).then(function (response) {
            updateLastActiveTimestamp();
            resolve(response);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function deleteUserGroup(params) {
    return new Promise(function(resolve, reject) {
        params = params ? params : {};

        validateRequiredGroup(params, reject);

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'groups/' + params.group, token);

        doDelete(url).then(function (response) {
            updateLastActiveTimestamp();
            resolve(response);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function getAllPublicTopics(params) {
    return new Promise(function(resolve, reject) {
        params = params ? params : {};

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'topics/', token);

        get(url).then(function (response) {
            updateLastActiveTimestamp();
            resolve(response);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function getPublicTopicDetails(params) {
    return new Promise(function(resolve, reject) {
        params = params ? params : {};

        validateRequiredTopic(params, reject);

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'topics/' + params.topic + '/details', token);

        get(url).then(function (response) {
            updateLastActiveTimestamp();
            resolve(response);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function createPublicTopic(params) {
    return new Promise(function(resolve, reject) {
        params = params ? params : {};

        validateRequiredTopic(params, reject);

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'topics/', token);

        post(url, { topic: params.topic }).then(function (response) {
            updateLastActiveTimestamp();
            resolve(response);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function updatePublicTopic(params) {
    return new Promise(function(resolve, reject) {
        params = params ? params : {};

        validateRequiredTopic(params, reject);

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'topics/' + params.topic.groupId, token);

        put(url, { topic: params.topic }).then(function (response) {
            updateLastActiveTimestamp();
            resolve(response);
        })['catch'](function (error) {
            reject(error);
        });
    });
}

export function deletePublicTopic(params) {
    return new Promise(function(resolve, reject) {
        params = params ? params : {};

        validateRequiredTopic(params, reject);

        const account = utils.validateAndReturnRequiredAccount(params, reject);
        const realm = utils.validateAndReturnRequiredRealmName(params, reject);
        const token = utils.validateAndReturnRequiredAccessToken(params, reject);

        const url = utils.getRealmResourceURL(authAdminURL, account, realm,
            'topics/' + params.topic, token);

        doDelete(url).then(function (response) {
            updateLastActiveTimestamp();
            resolve(response);
        })['catch'](function (error) {
            reject(error);
        });
    });
}
