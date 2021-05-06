let suffix = 'admin';
if (window.location.pathname.indexOf('client.html') > -1) {
    suffix = 'recipient';
}
const getFullKey = function(prefix) {
    return prefix + '_' + suffix;
}

export const TRANSACTION_KEY = getFullKey('voyentTransaction');
export const REALM_KEY = getFullKey('voyentRealm');
export const ADMIN_KEY = getFullKey('voyentAdmin');
export const USERNAME_KEY = getFullKey('voyentUsername');
export const ACCOUNT_KEY = getFullKey('voyentAccount');
export const HOST_KEY = getFullKey('voyentHost');
export const TOKEN_KEY = getFullKey('voyentToken');
export const TOKEN_EXPIRES_KEY = getFullKey('voyentTokenExpires');
export const TOKEN_SET_KEY = getFullKey('voyentTokenSet');
export const PASSWORD_KEY = getFullKey('voyentPassword');
export const CONNECT_SETTINGS_KEY = getFullKey('voyentConnectSettings');
export const RELOGIN_CB_KEY = getFullKey('voyentReloginCallback');
export const LAST_ACTIVE_TS_KEY = getFullKey('voyentLastActiveTimestamp');
export const COMPUTER_SLEEP_CB_KEY = getFullKey('voyentComputerSleepCallback');
export const VOYENT_INJECT_KEY = getFullKey('voyentNotificationToInject');